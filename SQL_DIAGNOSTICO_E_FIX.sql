-- =====================================================
-- SQL DIAGNÓSTICO + FIX COMPLETO
-- =====================================================
-- Este script VAI FUNCIONAR independente do estado atual do banco
-- Execute TUDO de uma vez só
-- =====================================================

-- =====================================================
-- PARTE 1: DIAGNÓSTICO (Veja os resultados)
-- =====================================================

-- Ver estrutura atual da tabela profiles
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Ver se existe o tipo ENUM user_role
SELECT
  typname,
  typtype
FROM pg_type
WHERE typname = 'user_role';

-- =====================================================
-- PARTE 2: FIX - Executar APÓS ver o diagnóstico
-- =====================================================
-- Cole este bloco SEPARADAMENTE após ver os resultados acima
-- =====================================================

-- PASSO 1: Remover policies que dependem de is_super_admin (temporário)
DROP POLICY IF EXISTS "Super admin full access to system_settings" ON system_settings;
DROP POLICY IF EXISTS "Super admins view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin view all ai_usage_metrics" ON ai_usage_metrics;
DROP POLICY IF EXISTS "Super admin manage plans" ON saas_plans;
DROP POLICY IF EXISTS "Super admin view all subscriptions" ON saas_subscriptions;
DROP POLICY IF EXISTS "Super admin view all invoices" ON invoices;
DROP POLICY IF EXISTS "Super admin view all logs" ON audit_logs;
DROP POLICY IF EXISTS "Super admin manage all feature_flags" ON feature_flags;

-- PASSO 2: Lidar com a coluna role
-- Se a coluna role NÃO existe, criar ela
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(50);
    RAISE NOTICE 'Coluna role criada';
  ELSE
    RAISE NOTICE 'Coluna role já existe';
  END IF;
END $$;

-- PASSO 3: Se existe tipo ENUM user_role, remover
DO $$
BEGIN
  -- Primeiro, converter a coluna para VARCHAR se estiver usando o enum
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    -- Alterar coluna para text temporariamente
    ALTER TABLE profiles ALTER COLUMN role TYPE TEXT USING role::TEXT;

    -- Dropar o tipo enum
    DROP TYPE IF EXISTS user_role CASCADE;

    -- Converter para VARCHAR(50)
    ALTER TABLE profiles ALTER COLUMN role TYPE VARCHAR(50);

    RAISE NOTICE 'Tipo ENUM user_role removido e coluna convertida para VARCHAR';
  ELSE
    -- Se não é enum, só garantir que é VARCHAR
    ALTER TABLE profiles ALTER COLUMN role TYPE VARCHAR(50);
    RAISE NOTICE 'Coluna role convertida para VARCHAR';
  END IF;
END $$;

-- PASSO 4: Adicionar is_super_admin se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
    RAISE NOTICE 'Coluna is_super_admin criada';
  ELSE
    RAISE NOTICE 'Coluna is_super_admin já existe';
  END IF;
END $$;

-- PASSO 5: Adicionar constraint de role (permitir os 4 valores)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('super_admin', 'admin', 'user', 'professional'));

-- PASSO 6: Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- PASSO 7: Recriar policies com is_super_admin

-- system_settings
CREATE POLICY "Super admin full access to system_settings"
ON system_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- profiles
CREATE POLICY "Super admins view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- ai_usage_metrics
CREATE POLICY "Super admin view all ai_usage_metrics"
ON ai_usage_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- saas_plans
CREATE POLICY "Super admin manage plans"
ON saas_plans FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- saas_subscriptions
CREATE POLICY "Super admin view all subscriptions"
ON saas_subscriptions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- invoices
CREATE POLICY "Super admin view all invoices"
ON invoices FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- audit_logs
CREATE POLICY "Super admin view all logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- feature_flags
CREATE POLICY "Super admin manage all feature_flags"
ON feature_flags FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- =====================================================
-- PASSO 8: Atualizar seu super admin existente
-- =====================================================

-- Atualizar profile do super admin
UPDATE profiles
SET
  is_super_admin = true,
  role = 'super_admin',
  name = COALESCE(name, 'Super Admin AION3')
WHERE id = 'd81fb567-11b8-4e3b-8a2d-428572278d0e';

-- Se não existe profile, criar
INSERT INTO profiles (id, unit_id, name, role, is_super_admin)
VALUES (
  'd81fb567-11b8-4e3b-8a2d-428572278d0e',
  NULL,
  'Super Admin AION3',
  'super_admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_super_admin = true,
  role = 'super_admin',
  name = 'Super Admin AION3';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Ver se super admin foi configurado corretamente
SELECT
  p.id,
  p.name,
  p.role,
  p.is_super_admin,
  au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.id = 'd81fb567-11b8-4e3b-8a2d-428572278d0e';

-- Deve retornar:
-- | id                                   | name              | role        | is_super_admin | email                  |
-- |--------------------------------------|-------------------|-------------|----------------|------------------------|
-- | d81fb567-11b8-4e3b-8a2d-428572278d0e | Super Admin AION3 | super_admin | true           | contato@aion3.com.br   |
