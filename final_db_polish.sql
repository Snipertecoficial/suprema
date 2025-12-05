-- =====================================================
-- PENTE FINO - FINALIZAÇÃO DO BANCO DE DADOS SAAS
-- =====================================================
-- Execute este script para:
-- 1. Blindar White-Label na tabela units
-- 2. Migrar Beto Style para assinatura ativa
-- 3. Criar tabela de integrações N8N
-- 4. Garantir policies de Super Admin
-- =====================================================

BEGIN;

-- =====================================================
-- 1. BLINDAGEM WHITE-LABEL (Tabela Units)
-- =====================================================

-- Adicionar colunas de White-Label se não existirem
ALTER TABLE units ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#000000';
ALTER TABLE units ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#ffffff';
ALTER TABLE units ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Constraint de domínio único (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'units_custom_domain_key'
  ) THEN
    ALTER TABLE units ADD CONSTRAINT units_custom_domain_key UNIQUE (custom_domain);
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_units_custom_domain ON units(custom_domain);
CREATE INDEX IF NOT EXISTS idx_units_slug ON units(slug);

-- =====================================================
-- 2. MIGRAÇÃO DO CLIENTE ZERO (Beto Style)
-- =====================================================

-- Verificar se o usuário styleb251@gmail.com existe
DO $$
DECLARE
  v_user_id UUID;
  v_unit_id UUID;
  v_plan_id UUID;
  v_subscription_exists BOOLEAN;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'styleb251@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'ATENÇÃO: Usuário styleb251@gmail.com não encontrado no auth.users';
    RAISE NOTICE 'Crie o usuário primeiro no Supabase Auth Dashboard';
  ELSE
    RAISE NOTICE 'Usuário encontrado: %', v_user_id;

    -- Buscar unit_id do profile
    SELECT unit_id INTO v_unit_id
    FROM profiles
    WHERE id = v_user_id;

    IF v_unit_id IS NULL THEN
      RAISE NOTICE 'ATENÇÃO: Profile do usuário não tem unit_id';
      RAISE NOTICE 'Você precisa criar uma unit para o Beto Style primeiro';
    ELSE
      RAISE NOTICE 'Unit encontrada: %', v_unit_id;

      -- Buscar ID do plano AION3 Enterprise
      SELECT id INTO v_plan_id
      FROM saas_plans
      WHERE slug = 'aion3-enterprise';

      IF v_plan_id IS NULL THEN
        RAISE NOTICE 'ERRO: Plano AION3 Enterprise não encontrado';
      ELSE
        RAISE NOTICE 'Plano encontrado: %', v_plan_id;

        -- Verificar se já existe assinatura
        SELECT EXISTS(
          SELECT 1 FROM saas_subscriptions WHERE unit_id = v_unit_id
        ) INTO v_subscription_exists;

        IF v_subscription_exists THEN
          RAISE NOTICE 'Assinatura já existe. Atualizando para ativa...';

          -- Atualizar assinatura existente
          UPDATE saas_subscriptions
          SET
            plan_id = v_plan_id,
            status = 'active',
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '10 years',
            trial_start = NULL,
            trial_end = NULL,
            cancel_at_period_end = false,
            canceled_at = NULL,
            updated_at = NOW()
          WHERE unit_id = v_unit_id;

          RAISE NOTICE '✅ Assinatura atualizada com sucesso!';
        ELSE
          RAISE NOTICE 'Criando nova assinatura...';

          -- Criar nova assinatura
          INSERT INTO saas_subscriptions (
            unit_id,
            plan_id,
            status,
            current_period_start,
            current_period_end,
            trial_start,
            trial_end
          ) VALUES (
            v_unit_id,
            v_plan_id,
            'active',
            NOW(),
            NOW() + INTERVAL '10 years',
            NULL,
            NULL
          );

          RAISE NOTICE '✅ Assinatura criada com sucesso!';
        END IF;
      END IF;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 3. CRIAR UNIT BETO STYLE (Se não existir)
-- =====================================================

-- Inserir unit Beto Style se não existir
INSERT INTO units (name, slug, whatsapp_instance_name, business_name)
VALUES (
  'Beto Style',
  'beto-style',
  'crm-beto-style',
  'Beto Style - Barbearia Premium'
)
ON CONFLICT (slug) DO UPDATE SET
  business_name = EXCLUDED.business_name;

-- Vincular usuário styleb251@gmail.com à unit (se ainda não estiver vinculado)
DO $$
DECLARE
  v_user_id UUID;
  v_unit_id UUID;
BEGIN
  -- Buscar IDs
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'styleb251@gmail.com';
  SELECT id INTO v_unit_id FROM units WHERE slug = 'beto-style';

  IF v_user_id IS NOT NULL AND v_unit_id IS NOT NULL THEN
    -- Atualizar profile para vincular à unit
    UPDATE profiles
    SET
      unit_id = v_unit_id,
      name = COALESCE(name, 'Beto'),
      role = COALESCE(role, 'admin')
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Profile vinculado à unit Beto Style';
  END IF;
END $$;

-- =====================================================
-- 4. TABELA: UNIT_INTEGRATIONS (N8N Plug-and-Play)
-- =====================================================

CREATE TABLE IF NOT EXISTS unit_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,

  -- Tipo de integração
  integration_type VARCHAR(100) NOT NULL,
  -- Exemplos: 'whatsapp_confirm', 'ai_churn', 'payment_notify', 'booking_reminder'

  -- URL do Webhook (N8N escuta aqui)
  webhook_url TEXT NOT NULL,

  -- Controle
  is_active BOOLEAN DEFAULT true,

  -- Configurações adicionais (JSON flexível)
  config JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Cada tipo de integração é único por unit
  UNIQUE(unit_id, integration_type)
);

-- RLS
ALTER TABLE unit_integrations ENABLE ROW LEVEL SECURITY;

-- Super admin vê e gerencia tudo
DROP POLICY IF EXISTS "Super admin manage all unit_integrations" ON unit_integrations;
CREATE POLICY "Super admin manage all unit_integrations"
ON unit_integrations FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- Tenants veem apenas suas integrações
DROP POLICY IF EXISTS "Tenants view their own integrations" ON unit_integrations;
CREATE POLICY "Tenants view their own integrations"
ON unit_integrations FOR SELECT TO authenticated
USING (
  unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid())
);

-- Tenants podem atualizar suas integrações (ativar/desativar)
DROP POLICY IF EXISTS "Tenants update their own integrations" ON unit_integrations;
CREATE POLICY "Tenants update their own integrations"
ON unit_integrations FOR UPDATE TO authenticated
USING (
  unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_unit_integrations_unit_id ON unit_integrations(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_integrations_type ON unit_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_unit_integrations_active ON unit_integrations(is_active);

-- =====================================================
-- 5. POLICIES FINAIS (Garantir Super Admin Access)
-- =====================================================

-- Units: Super admin pode ver e editar todas
DROP POLICY IF EXISTS "Super admin manage all units" ON units;
CREATE POLICY "Super admin manage all units"
ON units FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- System Settings: Já tem policy, garantir que existe
DROP POLICY IF EXISTS "Super admin full access to system_settings" ON system_settings;
CREATE POLICY "Super admin full access to system_settings"
ON system_settings FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

COMMIT;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Ver assinatura do Beto Style
SELECT
  u.name as unit_name,
  u.slug,
  au.email,
  ss.status,
  ss.current_period_end,
  sp.name as plan_name,
  sp.price_monthly_brl
FROM units u
JOIN profiles p ON p.unit_id = u.id
JOIN auth.users au ON au.id = p.id
LEFT JOIN saas_subscriptions ss ON ss.unit_id = u.id
LEFT JOIN saas_plans sp ON sp.id = ss.plan_id
WHERE u.slug = 'beto-style';

-- Ver colunas White-Label
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'units'
AND column_name IN (
  'brand_primary_color',
  'brand_secondary_color',
  'logo_url',
  'favicon_url',
  'custom_domain'
)
ORDER BY column_name;

-- Ver tabela de integrações
SELECT
  COUNT(*) as total_integrations,
  COUNT(CASE WHEN is_active THEN 1 END) as active_integrations
FROM unit_integrations;

-- Resumo final
SELECT '✅ BANCO DE DADOS 100% PRONTO!' as status;

-- =====================================================
-- PRÓXIMOS PASSOS
-- =====================================================

-- 1. ✅ Banco de dados está completo
-- 2. ⏳ Configurar Gemini API Key Master (SQL_CONFIGURAR_CHAVES_MASTER.sql)
-- 3. ⏳ Construir Dashboard Super Admin
-- 4. ⏳ Testar login como Beto Style
-- 5. ⏳ Criar integrações N8N para Beto Style
