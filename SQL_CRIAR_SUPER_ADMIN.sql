-- =====================================================
-- CRIAR SUPER ADMIN
-- =====================================================
-- IMPORTANTE: Execute APÓS criar o usuário no Supabase Auth
-- =====================================================

-- PASSO 1: Criar usuário no Supabase Dashboard
-- =====================================================
-- 1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/auth/users
-- 2. Clique em "Add User" → "Create new user"
-- 3. Preencha:
--    Email: contato@aion3.com.br
--    Password: [Defina uma senha forte]
--    Auto Confirm User: ✅ (marque)
-- 4. Clique em "Create User"
-- 5. COPIE O UUID DO USUÁRIO CRIADO
--    (Você verá algo como: f47ac10b-58cc-4372-a567-0e02b2c3d479)

-- =====================================================
-- PASSO 2: Criar Profile de Super Admin
-- =====================================================

-- SUBSTITUA 'uuid-do-usuario-auth' pelo UUID copiado acima

INSERT INTO profiles (id, unit_id, name, role, is_super_admin)
VALUES (
  'uuid-do-usuario-auth', -- ⚠️ SUBSTITUIR PELO UUID REAL!
  NULL, -- Super admin não pertence a nenhuma unit
  'Super Admin AION3',
  'super_admin',
  true
);

-- =====================================================
-- PASSO 3: Verificar se foi criado corretamente
-- =====================================================

SELECT
  p.id,
  p.name,
  p.role,
  p.is_super_admin,
  au.email,
  au.created_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.is_super_admin = true;

-- Resultado esperado:
-- | id                                   | name              | role        | is_super_admin | email                  | created_at          |
-- |--------------------------------------|-------------------|-------------|----------------|------------------------|---------------------|
-- | f47ac10b-58cc-4372-a567-0e02b2c3d479 | Super Admin AION3 | super_admin | true           | contato@aion3.com.br   | 2025-12-03 10:00:00 |

-- =====================================================
-- PASSO 4: Testar Login
-- =====================================================

-- 1. Acesse: http://localhost:3000/login
-- 2. Login com:
--    Email: contato@aion3.com.br
--    Senha: [A senha que você definiu]
-- 3. Você deve ter acesso total ao sistema
-- 4. Middleware irá reconhecer como super admin e ignorar verificação de assinatura

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- Se der erro "violates foreign key constraint":
-- Verifique se o UUID do usuário está correto:
SELECT id, email FROM auth.users WHERE email = 'contato@aion3.com.br';

-- Se o profile já existe mas não é super admin:
UPDATE profiles
SET is_super_admin = true, role = 'super_admin'
WHERE id = 'uuid-do-usuario-auth'; -- Substituir pelo UUID real

-- Se quiser deletar e recriar:
DELETE FROM profiles WHERE id = 'uuid-do-usuario-auth'; -- Substituir
-- Depois execute o INSERT novamente
