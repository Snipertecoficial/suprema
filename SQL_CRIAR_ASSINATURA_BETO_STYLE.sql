-- =====================================================
-- CRIAR ASSINATURA PARA BETO STYLE (Primeiro Cliente)
-- =====================================================
-- Execute APÓS ter o SQL principal rodando
-- =====================================================

-- =====================================================
-- PASSO 1: Verificar se a unit do Beto Style existe
-- =====================================================

SELECT id, name, slug, whatsapp_instance_name
FROM units
WHERE name ILIKE '%beto%' OR slug ILIKE '%beto%';

-- Se NÃO existir, criar:
-- (Se já existir, pule para o PASSO 2)

INSERT INTO units (name, slug, whatsapp_instance_name)
VALUES (
  'Beto Style',
  'beto-style',
  'crm-beto-style'
)
RETURNING id, name, slug;

-- COPIE O UUID DA UNIT (será usado nos próximos passos)

-- =====================================================
-- PASSO 2: Verificar usuário do Beto Style no Auth
-- =====================================================

SELECT id, email, created_at
FROM auth.users
WHERE email = 'styleb251@gmail.com';

-- Se NÃO existir, criar no Dashboard:
-- 1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/auth/users
-- 2. Add User → Create new user
-- 3. Email: styleb251@gmail.com
-- 4. Password: [Definir senha]
-- 5. Auto Confirm User: ✅
-- 6. COPIE O UUID DO USUÁRIO

-- =====================================================
-- PASSO 3: Criar ou atualizar profile do Beto Style
-- =====================================================

-- SUBSTITUA os UUIDs:
-- - 'uuid-do-usuario-beto' → UUID do auth.users (styleb251@gmail.com)
-- - 'uuid-da-unit-beto-style' → UUID da unit criada/encontrada

-- Verificar se profile já existe:
SELECT p.id, p.name, p.unit_id, au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'styleb251@gmail.com';

-- Se NÃO existir, criar:
INSERT INTO profiles (id, unit_id, name, role, is_super_admin)
VALUES (
  'uuid-do-usuario-beto', -- ⚠️ SUBSTITUIR
  'uuid-da-unit-beto-style', -- ⚠️ SUBSTITUIR
  'Beto',
  'admin',
  false
);

-- Se JÁ existir mas sem unit_id, atualizar:
UPDATE profiles
SET unit_id = 'uuid-da-unit-beto-style' -- ⚠️ SUBSTITUIR
WHERE id = 'uuid-do-usuario-beto'; -- ⚠️ SUBSTITUIR

-- =====================================================
-- PASSO 4: Buscar ID do plano AION3 Enterprise
-- =====================================================

SELECT id, name, slug, price_monthly_brl
FROM saas_plans
WHERE slug = 'aion3-enterprise';

-- COPIE O UUID DO PLANO (será usado no próximo passo)

-- =====================================================
-- PASSO 5: Criar assinatura TRIAL de 30 dias
-- =====================================================

-- SUBSTITUA os UUIDs:
-- - 'uuid-da-unit-beto-style' → UUID da unit Beto Style
-- - 'uuid-do-plano-aion3' → UUID do plano AION3 Enterprise

INSERT INTO saas_subscriptions (
  unit_id,
  plan_id,
  status,
  trial_start,
  trial_end,
  current_period_start,
  current_period_end
)
VALUES (
  'uuid-da-unit-beto-style', -- ⚠️ SUBSTITUIR
  'uuid-do-plano-aion3', -- ⚠️ SUBSTITUIR
  'trialing', -- Status: em trial
  NOW(), -- Trial começa agora
  NOW() + INTERVAL '30 days', -- Trial de 30 dias
  NOW(), -- Período atual começa agora
  NOW() + INTERVAL '30 days' -- Período atual termina em 30 dias
)
RETURNING id, status, trial_end;

-- =====================================================
-- PASSO 6: Verificar se tudo está correto
-- =====================================================

-- Query completa para validar:
SELECT
  u.id as unit_id,
  u.name as unit_name,
  u.slug,
  p.id as profile_id,
  p.name as user_name,
  au.email,
  ss.status as subscription_status,
  ss.trial_end,
  sp.name as plan_name,
  sp.price_monthly_brl
FROM units u
LEFT JOIN profiles p ON p.unit_id = u.id
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN saas_subscriptions ss ON ss.unit_id = u.id
LEFT JOIN saas_plans sp ON sp.id = ss.plan_id
WHERE u.slug = 'beto-style';

-- Resultado esperado:
-- | unit_id | unit_name  | slug       | profile_id | user_name | email                | subscription_status | trial_end           | plan_name         | price_monthly_brl |
-- |---------|------------|------------|------------|-----------|----------------------|---------------------|---------------------|-------------------|-------------------|
-- | xxx     | Beto Style | beto-style | yyy        | Beto      | styleb251@gmail.com  | trialing            | 2026-01-02 10:00:00 | AION3 Enterprise  | 997.00            |

-- =====================================================
-- PASSO 7: Testar Login do Beto Style
-- =====================================================

-- 1. Acesse: http://localhost:3000/login
-- 2. Login com:
--    Email: styleb251@gmail.com
--    Senha: [A senha que você definiu]
-- 3. Middleware deve:
--    ✅ Verificar que está autenticado
--    ✅ Verificar que tem assinatura (status: trialing)
--    ✅ Permitir acesso ao /dashboard
-- 4. Você verá o CRM completo do Beto Style

-- =====================================================
-- SCRIPT ALTERNATIVO: CRIAR TUDO DE UMA VEZ
-- =====================================================
-- Use este bloco se quiser criar unit + profile + assinatura de uma vez
-- IMPORTANTE: Substitua TODOS os valores marcados com ⚠️

/*
-- 1. Criar unit
INSERT INTO units (name, slug, whatsapp_instance_name)
VALUES ('Beto Style', 'beto-style', 'crm-beto-style')
RETURNING id;
-- COPIE O UUID: por exemplo, '123e4567-e89b-12d3-a456-426614174000'

-- 2. Criar usuário no Auth Dashboard
-- Email: styleb251@gmail.com
-- Password: BetоStyle@2025 (exemplo)
-- COPIE O UUID DO USUÁRIO: por exemplo, '987fcdeb-51a2-43f6-d321-987654321000'

-- 3. Criar profile
INSERT INTO profiles (id, unit_id, name, role, is_super_admin)
VALUES (
  '987fcdeb-51a2-43f6-d321-987654321000', -- ⚠️ UUID do usuário Auth
  '123e4567-e89b-12d3-a456-426614174000', -- ⚠️ UUID da unit
  'Beto',
  'admin',
  false
);

-- 4. Buscar ID do plano
SELECT id FROM saas_plans WHERE slug = 'aion3-enterprise';
-- COPIE O UUID: por exemplo, 'aaa11111-2222-3333-4444-555555555555'

-- 5. Criar assinatura
INSERT INTO saas_subscriptions (unit_id, plan_id, status, trial_start, trial_end, current_period_start, current_period_end)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000', -- ⚠️ UUID da unit
  'aaa11111-2222-3333-4444-555555555555', -- ⚠️ UUID do plano
  'trialing',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW() + INTERVAL '30 days'
);
*/

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- Erro: "violates foreign key constraint on unit_id"
-- Solução: Verifique se a unit existe e o UUID está correto
SELECT id FROM units WHERE slug = 'beto-style';

-- Erro: "violates foreign key constraint on plan_id"
-- Solução: Verifique se o plano existe
SELECT id FROM saas_plans WHERE slug = 'aion3-enterprise';

-- Erro: "duplicate key value violates unique constraint"
-- Solução: Já existe assinatura para essa unit, delete e recrie:
DELETE FROM saas_subscriptions WHERE unit_id = 'uuid-da-unit-beto-style';
-- Depois execute o INSERT novamente

-- Ver assinaturas existentes:
SELECT
  ss.id,
  u.name as unit_name,
  ss.status,
  ss.trial_end,
  sp.name as plan_name
FROM saas_subscriptions ss
JOIN units u ON u.id = ss.unit_id
JOIN saas_plans sp ON sp.id = ss.plan_id;

-- Deletar assinatura (se necessário recomeçar):
DELETE FROM saas_subscriptions WHERE unit_id = 'uuid-da-unit-beto-style';
