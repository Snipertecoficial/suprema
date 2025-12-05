# 🚀 GUIA DE EXECUÇÃO - SQL NO SUPABASE

**Ordem de Execução:** Siga exatamente esta sequência!

---

## 📋 ORDEM DE EXECUÇÃO

### 1️⃣ **SQL Principal** (Obrigatório)
**Arquivo:** `SQL_PARA_EXECUTAR_AGORA.sql`

**O que faz:**
- ✅ Cria tabela `system_settings`
- ✅ Atualiza tabela `profiles` (adiciona `is_super_admin`)
- ✅ Atualiza tabela `units` (remove campos obsoletos, adiciona `ai_features_enabled`)
- ✅ Cria tabela `ai_usage_metrics`
- ✅ Cria função `increment_ai_usage()`
- ✅ Cria tabela `saas_plans` (plano AION3 Enterprise)
- ✅ Cria tabela `saas_subscriptions`
- ✅ Cria tabela `invoices`
- ✅ Cria tabela `audit_logs`
- ✅ Cria tabela `feature_flags`
- ✅ Cria views úteis

**Como executar:**
```
1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql
2. Cole TODO o conteúdo de SQL_PARA_EXECUTAR_AGORA.sql
3. Clique em "Run"
4. Aguarde conclusão (pode levar 10-20 segundos)
5. Verifique se apareceu "Success" ✅
```

---

### 2️⃣ **Criar Super Admin** (Obrigatório)
**Arquivo:** `SQL_CRIAR_SUPER_ADMIN.sql`

**IMPORTANTE:** Execute em 2 partes!

**Parte A - No Dashboard do Supabase:**
```
1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/auth/users
2. Clique em "Add User" → "Create new user"
3. Preencha:
   Email: contato@aion3.com.br
   Password: [Defina senha forte - SALVE EM LUGAR SEGURO!]
   Auto Confirm User: ✅
4. Clique em "Create User"
5. COPIE o UUID do usuário criado
   (Aparece na lista, algo como: f47ac10b-58cc-4372-a567-0e02b2c3d479)
```

**Parte B - No SQL Editor:**
```sql
-- Cole este SQL substituindo o UUID:

INSERT INTO profiles (id, unit_id, name, role, is_super_admin)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- ⚠️ COLAR O UUID COPIADO
  NULL,
  'Super Admin AION3',
  'super_admin',
  true
);

-- Verificar:
SELECT p.*, au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.is_super_admin = true;
```

---

### 3️⃣ **Criar Assinatura Beto Style** (Obrigatório)
**Arquivo:** `SQL_CRIAR_ASSINATURA_BETO_STYLE.sql`

**IMPORTANTE:** Processo em 5 etapas!

**Etapa 1 - Verificar/Criar Unit:**
```sql
-- Verificar se existe:
SELECT id, name, slug FROM units WHERE slug = 'beto-style';

-- Se NÃO existe, criar:
INSERT INTO units (name, slug, whatsapp_instance_name)
VALUES ('Beto Style', 'beto-style', 'crm-beto-style')
RETURNING id;

-- COPIAR O UUID RETORNADO
```

**Etapa 2 - Criar usuário Beto (Dashboard):**
```
1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/auth/users
2. Add User → Create new user
3. Email: styleb251@gmail.com
4. Password: [Definir senha - SALVAR!]
5. Auto Confirm User: ✅
6. COPIAR UUID do usuário
```

**Etapa 3 - Criar Profile:**
```sql
INSERT INTO profiles (id, unit_id, name, role, is_super_admin)
VALUES (
  'uuid-usuario-beto', -- ⚠️ UUID do usuário (Etapa 2)
  'uuid-unit-beto',    -- ⚠️ UUID da unit (Etapa 1)
  'Beto',
  'admin',
  false
);
```

**Etapa 4 - Buscar ID do Plano:**
```sql
SELECT id FROM saas_plans WHERE slug = 'aion3-enterprise';
-- COPIAR O UUID DO PLANO
```

**Etapa 5 - Criar Assinatura Trial:**
```sql
INSERT INTO saas_subscriptions (unit_id, plan_id, status, trial_start, trial_end, current_period_start, current_period_end)
VALUES (
  'uuid-unit-beto',  -- ⚠️ UUID da unit
  'uuid-plano',      -- ⚠️ UUID do plano (Etapa 4)
  'trialing',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW() + INTERVAL '30 days'
);
```

**Etapa 6 - Verificar se deu tudo certo:**
```sql
SELECT
  u.name as unit_name,
  u.slug,
  au.email,
  ss.status,
  ss.trial_end,
  sp.name as plan_name
FROM units u
JOIN profiles p ON p.unit_id = u.id
JOIN auth.users au ON au.id = p.id
JOIN saas_subscriptions ss ON ss.unit_id = u.id
JOIN saas_plans sp ON sp.id = ss.plan_id
WHERE u.slug = 'beto-style';

-- Deve retornar 1 linha mostrando tudo configurado ✅
```

---

### 4️⃣ **Configurar Chaves Master** (Obrigatório)
**Arquivo:** `SQL_CONFIGURAR_CHAVES_MASTER.sql`

**Passo 1 - Obter Gemini API Key:**
```
1. Acesse: https://makersuite.google.com/app/apikey
2. Login com Google
3. Create API Key
4. COPIAR a key (começa com AIza...)
```

**Passo 2 - Obter Evolution Token:**
```
(Se você tem Evolution API próprio)
1. Acesse painel Evolution
2. Settings → API
3. COPIAR o Global API Key
```

**Passo 3 - Configurar no Banco:**
```sql
UPDATE system_settings
SET
  gemini_api_key_master = 'AIzaSy...', -- ⚠️ COLAR SUA KEY REAL
  evolution_api_global_token = 'seu-token', -- ⚠️ COLAR TOKEN REAL
  evolution_api_base_url = 'https://evolution.aion3.com.br',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verificar:
SELECT
  CASE WHEN gemini_api_key_master IS NOT NULL THEN '✅ OK' ELSE '❌ Falta' END as gemini,
  CASE WHEN evolution_api_global_token IS NOT NULL THEN '✅ OK' ELSE '❌ Falta' END as evolution
FROM system_settings;
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Execute estes comandos para validar tudo:

```sql
-- 1. Verificar system_settings
SELECT id, maintenance_mode, ai_model_name FROM system_settings;
-- Deve retornar 1 linha ✅

-- 2. Verificar super admin
SELECT p.name, au.email, p.is_super_admin
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.is_super_admin = true;
-- Deve retornar: Super Admin AION3, contato@aion3.com.br, true ✅

-- 3. Verificar plano
SELECT slug, name, price_monthly_brl FROM saas_plans;
-- Deve retornar: aion3-enterprise, AION3 Enterprise, 997.00 ✅

-- 4. Verificar Beto Style completo
SELECT
  u.name,
  au.email,
  p.role,
  ss.status,
  TO_CHAR(ss.trial_end, 'DD/MM/YYYY') as trial_ate,
  sp.name as plano
FROM units u
JOIN profiles p ON p.unit_id = u.id
JOIN auth.users au ON au.id = p.id
JOIN saas_subscriptions ss ON ss.unit_id = u.id
JOIN saas_plans sp ON sp.id = ss.plan_id
WHERE u.slug = 'beto-style';
-- Deve retornar linha completa com trial ativo ✅

-- 5. Verificar chaves configuradas
SELECT
  CASE WHEN gemini_api_key_master IS NOT NULL THEN '✅' ELSE '❌' END as gemini,
  CASE WHEN evolution_api_global_token IS NOT NULL THEN '✅' ELSE '❌' END as evolution
FROM system_settings;
-- Ambos devem estar ✅

-- 6. Contar tabelas criadas
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'system_settings',
  'ai_usage_metrics',
  'saas_plans',
  'saas_subscriptions',
  'invoices',
  'audit_logs',
  'feature_flags'
);
-- Deve retornar 7 ✅
```

---

## 🧪 TESTAR NO BROWSER

### Teste 1: Login Super Admin
```
1. Acesse: http://localhost:3000/login
2. Login:
   Email: contato@aion3.com.br
   Senha: [A que você definiu]
3. Deve entrar sem problemas
4. Middleware reconhece como super admin
5. Ignora verificação de assinatura
```

### Teste 2: Login Beto Style
```
1. Logout
2. Login:
   Email: styleb251@gmail.com
   Senha: [A que você definiu]
3. Deve entrar
4. Middleware verifica:
   ✅ Autenticado
   ✅ Tem assinatura (trialing)
   ✅ Permite acesso
5. Vê dashboard do Beto Style
```

### Teste 3: Verificar Trial Expirando
```
1. Abra DevTools (F12)
2. Aba Network
3. Navegue para qualquer página
4. Veja Headers da Response
5. Se faltar < 7 dias para trial expirar, deve ter:
   X-Subscription-Expiring-Soon: true
   X-Days-Until-Expiration: N
```

---

## 🔧 TROUBLESHOOTING

### ❌ Erro: "relation does not exist"
**Causa:** Tabela não foi criada
**Solução:** Execute SQL_PARA_EXECUTAR_AGORA.sql novamente

### ❌ Erro: "violates foreign key constraint"
**Causa:** UUID incorreto ou não existe
**Solução:** Verifique se copiou o UUID correto:
```sql
-- Ver usuários:
SELECT id, email FROM auth.users;

-- Ver units:
SELECT id, slug FROM units;

-- Ver planos:
SELECT id, slug FROM saas_plans;
```

### ❌ Erro: "new row violates row-level security policy"
**Causa:** RLS está bloqueando
**Solução:** Use Service Role Key ou verifique policies

### ❌ Login não funciona
**Causa:** Usuário não foi confirmado
**Solução:** No Dashboard Auth, marque "Email Confirmed"

### ❌ Redirecionado para /billing/reactivate
**Causa:** Assinatura não está ativa
**Solução:** Verifique status:
```sql
SELECT status, trial_end FROM saas_subscriptions WHERE unit_id = '...';
-- Status deve ser 'active' ou 'trialing'
```

### ❌ Gemini API não funciona
**Causa:** Chave inválida ou não configurada
**Solução:**
```sql
SELECT gemini_api_key_master FROM system_settings;
-- Se NULL, configure
-- Se preenchida mas não funciona, gere nova chave
```

---

## 📞 PRÓXIMOS PASSOS APÓS SQL

1. ✅ **Testar Login** (Super Admin + Beto Style)
2. ✅ **Criar Dashboard Super Admin** (página de configurações)
3. ✅ **Testar Geração de IA** (enviar mensagem WhatsApp)
4. ✅ **Ver Uso de IA** (verificar ai_usage_metrics)
5. ✅ **Integrar Stripe** (quando estiver pronto)

---

## 💾 BACKUP RECOMENDADO

Após executar tudo com sucesso:

```bash
# Via pg_dump (se tiver acesso)
pg_dump -h seu-host.supabase.co -U postgres -d postgres > backup_pos_setup.sql

# Via Dashboard Supabase
Database → Backups → Create Backup
```

---

**SCRIPTS PRONTOS!** ✅

Execute na ordem e valide cada etapa antes de avançar.
