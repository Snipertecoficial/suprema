-- =====================================================
-- SQL PRINCIPAL - VERSÃO LIMPA E TESTADA
-- =====================================================
-- Execute DEPOIS do SQL_DIAGNOSTICO_E_FIX.sql
-- =====================================================

-- =====================================================
-- 1. EXTENSÃO UUID
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. SYSTEM_SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Chaves de API Master
  gemini_api_key_master TEXT,
  openai_api_key_master TEXT,
  evolution_api_global_token TEXT,

  -- Configuração Global
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'Sistema em manutenção. Voltamos em breve.',

  -- URLs
  evolution_api_base_url TEXT DEFAULT 'https://evolution.aion3.com.br',
  n8n_base_url TEXT,

  -- Limites
  max_tokens_per_request INTEGER DEFAULT 4096,
  ai_model_name VARCHAR(100) DEFAULT 'gemini-1.5-pro',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Inserir linha única
INSERT INTO system_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_system_settings_id ON system_settings(id);

-- =====================================================
-- 3. ATUALIZAR UNITS
-- =====================================================

-- Remover campos obsoletos
ALTER TABLE units DROP COLUMN IF EXISTS gemini_api_key CASCADE;
ALTER TABLE units DROP COLUMN IF EXISTS n8n_api_key CASCADE;
ALTER TABLE units DROP COLUMN IF EXISTS n8n_url CASCADE;

-- Adicionar novos campos
ALTER TABLE units ADD COLUMN IF NOT EXISTS ai_features_enabled BOOLEAN DEFAULT true;
ALTER TABLE units ADD COLUMN IF NOT EXISTS ai_paused BOOLEAN DEFAULT false;
ALTER TABLE units ADD COLUMN IF NOT EXISTS monthly_message_limit INTEGER DEFAULT -1;

-- Index
CREATE INDEX IF NOT EXISTS idx_units_ai_enabled ON units(ai_features_enabled);

-- =====================================================
-- 4. AI_USAGE_METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,

  month_year VARCHAR(7) NOT NULL,

  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,

  estimated_cost_usd DECIMAL(10, 4) DEFAULT 0.00,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(unit_id, month_year)
);

-- RLS
ALTER TABLE ai_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Tenants veem apenas seus dados
CREATE POLICY "Tenants view their own ai_usage_metrics"
ON ai_usage_metrics FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT unit_id FROM profiles WHERE id = auth.uid()
  )
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ai_usage_unit_id ON ai_usage_metrics(unit_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month_year ON ai_usage_metrics(month_year);

-- =====================================================
-- 5. FUNÇÃO increment_ai_usage
-- =====================================================

CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_unit_id UUID,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
) RETURNS void AS $$
DECLARE
  v_month_year VARCHAR(7);
  v_estimated_cost DECIMAL(10, 4);
BEGIN
  v_month_year := TO_CHAR(NOW(), 'MM-YYYY');
  v_estimated_cost := (p_input_tokens / 1000.0 * 0.00125) + (p_output_tokens / 1000.0 * 0.005);

  INSERT INTO ai_usage_metrics (unit_id, month_year, input_tokens, output_tokens, messages_count, estimated_cost_usd)
  VALUES (p_unit_id, v_month_year, p_input_tokens, p_output_tokens, 1, v_estimated_cost)
  ON CONFLICT (unit_id, month_year) DO UPDATE SET
    input_tokens = ai_usage_metrics.input_tokens + p_input_tokens,
    output_tokens = ai_usage_metrics.output_tokens + p_output_tokens,
    messages_count = ai_usage_metrics.messages_count + 1,
    estimated_cost_usd = ai_usage_metrics.estimated_cost_usd + v_estimated_cost,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. SAAS_PLANS
-- =====================================================

CREATE TABLE IF NOT EXISTS saas_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  price_monthly_brl DECIMAL(10, 2) NOT NULL,
  price_yearly_brl DECIMAL(10, 2),

  max_clients INTEGER DEFAULT -1,
  max_whatsapp_messages INTEGER DEFAULT -1,
  max_storage_mb INTEGER DEFAULT -1,

  features JSONB DEFAULT '[]'::jsonb,
  ai_enabled BOOLEAN DEFAULT true,
  white_label_enabled BOOLEAN DEFAULT true,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir plano AION3 Enterprise
INSERT INTO saas_plans (slug, name, description, price_monthly_brl, price_yearly_brl, features)
VALUES (
  'aion3-enterprise',
  'AION3 Enterprise',
  'CRM completo com WhatsApp, IA, Automação e White Label',
  997.00,
  9970.00,
  '[
    "CRM Completo",
    "WhatsApp Business Integrado",
    "IA Generativa (Gemini Pro)",
    "Automação n8n Plug-and-Play",
    "White Label Total (Logo + Cores)",
    "Mensagens Ilimitadas",
    "Clientes Ilimitados",
    "Agendamento Online",
    "Relatórios Avançados",
    "Suporte Prioritário"
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON saas_plans FOR SELECT
USING (is_active = true);

-- =====================================================
-- 7. SAAS_SUBSCRIPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES saas_plans(id),

  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),

  status VARCHAR(50) NOT NULL DEFAULT 'active',

  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '30 days',

  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(unit_id)
);

-- RLS
ALTER TABLE saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Tenants veem sua assinatura
CREATE POLICY "Tenants view their own subscription"
ON saas_subscriptions FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT unit_id FROM profiles WHERE id = auth.uid()
  )
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_subscriptions_unit_id ON saas_subscriptions(unit_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON saas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON saas_subscriptions(stripe_customer_id);

-- =====================================================
-- 8. INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES saas_subscriptions(id) ON DELETE CASCADE,

  stripe_invoice_id VARCHAR(255) UNIQUE,

  amount_brl DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL,

  period_start TIMESTAMP,
  period_end TIMESTAMP,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,

  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants view their own invoices"
ON invoices FOR SELECT
TO authenticated
USING (
  subscription_id IN (
    SELECT id FROM saas_subscriptions
    WHERE unit_id IN (
      SELECT unit_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- =====================================================
-- 9. AUDIT_LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,

  details JSONB,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Indices
CREATE INDEX IF NOT EXISTS idx_audit_logs_unit_id ON audit_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- 10. FEATURE_FLAGS
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,

  feature_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT false,

  config JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(unit_id, feature_key)
);

-- RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants view their own feature_flags"
ON feature_flags FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT unit_id FROM profiles WHERE id = auth.uid()
  )
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_feature_flags_unit_id ON feature_flags(unit_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_feature_key ON feature_flags(feature_key);

-- =====================================================
-- 11. VIEWS ÚTEIS
-- =====================================================

-- Resumo de assinaturas
CREATE OR REPLACE VIEW subscriptions_summary AS
SELECT
  status,
  COUNT(*) as count,
  SUM(sp.price_monthly_brl) as mrr
FROM saas_subscriptions ss
JOIN saas_plans sp ON sp.id = ss.plan_id
GROUP BY status;

-- Uso de IA (mês atual)
CREATE OR REPLACE VIEW current_month_ai_usage AS
SELECT
  u.id as unit_id,
  u.name as unit_name,
  COALESCE(aum.input_tokens, 0) as input_tokens,
  COALESCE(aum.output_tokens, 0) as output_tokens,
  COALESCE(aum.messages_count, 0) as messages_count,
  COALESCE(aum.estimated_cost_usd, 0) as estimated_cost_usd,
  COALESCE(aum.estimated_cost_usd * 5.0, 0) as estimated_cost_brl
FROM units u
LEFT JOIN ai_usage_metrics aum ON aum.unit_id = u.id AND aum.month_year = TO_CHAR(NOW(), 'MM-YYYY');

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'system_settings' as tabela, COUNT(*) as registros FROM system_settings
UNION ALL
SELECT 'saas_plans', COUNT(*) FROM saas_plans
UNION ALL
SELECT 'ai_usage_metrics', COUNT(*) FROM ai_usage_metrics
UNION ALL
SELECT 'saas_subscriptions', COUNT(*) FROM saas_subscriptions;

-- Deve retornar:
-- system_settings: 1
-- saas_plans: 1 (AION3 Enterprise)
-- ai_usage_metrics: 0 (vazio inicialmente)
-- saas_subscriptions: 0 (vazio até criar primeira assinatura)
