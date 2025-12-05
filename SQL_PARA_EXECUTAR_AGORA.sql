-- =====================================================
-- SQL PARA EXECUTAR NO SUPABASE - ORDEM CORRETA
-- =====================================================
-- Data: 03/12/2025
-- Execute na ordem apresentada
-- =====================================================

-- =====================================================
-- PASSO 1: CRIAR EXTENSÃO UUID (se não existir)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PASSO 2: SYSTEM_SETTINGS (Configuração Global)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Chaves de API Centralizadas (Master Keys)
  gemini_api_key_master TEXT,
  openai_api_key_master TEXT,
  evolution_api_global_token TEXT,

  -- Configuração Global
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'Sistema em manutenção. Voltamos em breve.',

  -- URLs Globais
  evolution_api_base_url TEXT DEFAULT 'https://evolution.aion3.com.br',
  n8n_base_url TEXT,

  -- Limites Globais
  max_tokens_per_request INTEGER DEFAULT 4096,
  ai_model_name VARCHAR(100) DEFAULT 'gemini-1.5-pro',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Garantir apenas 1 linha
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Inserir linha única
INSERT INTO system_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to system_settings"
ON system_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_system_settings_id ON system_settings(id);

-- =====================================================
-- PASSO 3: ATUALIZAR TABELA PROFILES
-- =====================================================

-- Adicionar coluna is_super_admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Atualizar constraint de role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('super_admin', 'admin', 'user', 'professional'));

-- Índice
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin);

-- Policy para super admin ver todos os profiles
DROP POLICY IF EXISTS "Super admins view all profiles" ON profiles;

CREATE POLICY "Super admins view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- =====================================================
-- PASSO 4: ATUALIZAR TABELA UNITS
-- =====================================================

-- Remover campos obsoletos (se existirem)
ALTER TABLE units DROP COLUMN IF EXISTS gemini_api_key CASCADE;
ALTER TABLE units DROP COLUMN IF EXISTS n8n_api_key CASCADE;
ALTER TABLE units DROP COLUMN IF EXISTS n8n_url CASCADE;

-- Adicionar novos campos
ALTER TABLE units ADD COLUMN IF NOT EXISTS ai_features_enabled BOOLEAN DEFAULT true;
ALTER TABLE units ADD COLUMN IF NOT EXISTS ai_paused BOOLEAN DEFAULT false;
ALTER TABLE units ADD COLUMN IF NOT EXISTS monthly_message_limit INTEGER DEFAULT -1;

-- Índice
CREATE INDEX IF NOT EXISTS idx_units_ai_enabled ON units(ai_features_enabled);

-- =====================================================
-- PASSO 5: AI_USAGE_METRICS (Controle de Custo)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,

  -- Período (formato: MM-YYYY)
  month_year VARCHAR(7) NOT NULL,

  -- Métricas de Consumo
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,

  -- Custo Estimado
  estimated_cost_usd DECIMAL(10, 4) DEFAULT 0.00,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique: 1 registro por unit por mês
  UNIQUE(unit_id, month_year)
);

-- RLS
ALTER TABLE ai_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Super admin vê tudo
CREATE POLICY "Super admin view all ai_usage_metrics"
ON ai_usage_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Tenants veem apenas seus próprios dados
CREATE POLICY "Tenants view their own ai_usage_metrics"
ON ai_usage_metrics FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT unit_id FROM profiles WHERE id = auth.uid()
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_usage_unit_id ON ai_usage_metrics(unit_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month_year ON ai_usage_metrics(month_year);

-- =====================================================
-- PASSO 6: FUNÇÃO PARA RASTREAR USO DE IA
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
  -- Calcular mês atual
  v_month_year := TO_CHAR(NOW(), 'MM-YYYY');

  -- Calcular custo (Gemini Pro: $0.00125 / 1K input, $0.005 / 1K output)
  v_estimated_cost := (p_input_tokens / 1000.0 * 0.00125) + (p_output_tokens / 1000.0 * 0.005);

  -- Inserir ou atualizar
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
-- PASSO 7: SAAS_PLANS (Planos de Assinatura)
-- =====================================================

CREATE TABLE IF NOT EXISTS saas_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificação
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Preço
  price_monthly_brl DECIMAL(10, 2) NOT NULL,
  price_yearly_brl DECIMAL(10, 2),

  -- Limites
  max_clients INTEGER DEFAULT -1,
  max_whatsapp_messages INTEGER DEFAULT -1,
  max_storage_mb INTEGER DEFAULT -1,

  -- Features
  features JSONB DEFAULT '[]'::jsonb,
  ai_enabled BOOLEAN DEFAULT true,
  white_label_enabled BOOLEAN DEFAULT true,

  -- Metadata
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

CREATE POLICY "Super admin manage plans"
ON saas_plans FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- =====================================================
-- PASSO 8: SAAS_SUBSCRIPTIONS (Assinaturas)
-- =====================================================

CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES saas_plans(id),

  -- Stripe
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',

  -- Períodos
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '30 days',

  -- Cancelamento
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(unit_id)
);

-- RLS
ALTER TABLE saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Super admin vê tudo
CREATE POLICY "Super admin view all subscriptions"
ON saas_subscriptions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Tenants veem apenas sua própria assinatura
CREATE POLICY "Tenants view their own subscription"
ON saas_subscriptions FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT unit_id FROM profiles WHERE id = auth.uid()
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_unit_id ON saas_subscriptions(unit_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON saas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON saas_subscriptions(stripe_customer_id);

-- =====================================================
-- PASSO 9: INVOICES (Faturas)
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES saas_subscriptions(id) ON DELETE CASCADE,

  -- Stripe
  stripe_invoice_id VARCHAR(255) UNIQUE,

  -- Dados
  amount_brl DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL,

  -- Datas
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,

  -- URLs
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin view all invoices"
ON invoices FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- =====================================================
-- PASSO 10: AUDIT_LOGS (Logs de Auditoria)
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Evento
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,

  -- Detalhes
  details JSONB,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin view all logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_logs_unit_id ON audit_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- PASSO 11: FEATURE_FLAGS (Flags de Features)
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,

  -- Feature
  feature_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT false,

  -- Metadata
  config JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(unit_id, feature_key)
);

-- RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manage all feature_flags"
ON feature_flags FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Tenants view their own feature_flags"
ON feature_flags FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT unit_id FROM profiles WHERE id = auth.uid()
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_feature_flags_unit_id ON feature_flags(unit_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_feature_key ON feature_flags(feature_key);

-- =====================================================
-- PASSO 12: VIEWS ÚTEIS
-- =====================================================

-- View: Resumo de Assinaturas por Status
CREATE OR REPLACE VIEW subscriptions_summary AS
SELECT
  status,
  COUNT(*) as count,
  SUM(sp.price_monthly_brl) as mrr
FROM saas_subscriptions ss
JOIN saas_plans sp ON sp.id = ss.plan_id
GROUP BY status;

-- View: Uso de IA por Tenant (Mês Atual)
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
-- FIM DO SCRIPT PRINCIPAL
-- =====================================================

-- ✅ Tabelas criadas
-- ✅ RLS policies aplicadas
-- ✅ Funções criadas
-- ✅ Views criadas
-- ✅ Plano AION3 Enterprise inserido

-- PRÓXIMOS PASSOS:
-- 1. Criar super admin (ver próximo script)
-- 2. Criar assinatura para Beto Style (ver próximo script)
-- 3. Configurar Gemini API Key Master via Dashboard
