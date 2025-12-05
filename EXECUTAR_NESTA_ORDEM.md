# 🎯 EXECUTAR SQL NESTA ORDEM

**PARE DE PENSAR E SIGA EXATAMENTE ASSIM:**

---

## 1️⃣ SQL_DIAGNOSTICO_E_FIX.sql

**Execute TODO o arquivo** no SQL Editor do Supabase.

Isso vai:
- ✅ Corrigir problema do ENUM user_role
- ✅ Criar/atualizar coluna `role` como VARCHAR
- ✅ Criar coluna `is_super_admin`
- ✅ Configurar seu super admin (contato@aion3.com.br)
- ✅ Criar todas as policies

**Como executar:**
```
1. Abra: https://supabase.com/dashboard/project/SEU_PROJETO/sql
2. Cole TODO o conteúdo do arquivo SQL_DIAGNOSTICO_E_FIX.sql
3. Clique em "Run"
4. Aguarde até aparecer "Success"
```

**Se der erro:**
- Copie a mensagem de erro COMPLETA
- Me envie

---

## 2️⃣ SQL_PRINCIPAL_LIMPO.sql

**Execute TODO o arquivo** no SQL Editor.

Isso vai criar:
- ✅ system_settings
- ✅ ai_usage_metrics
- ✅ saas_plans (com plano AION3 Enterprise)
- ✅ saas_subscriptions
- ✅ invoices
- ✅ audit_logs
- ✅ feature_flags
- ✅ Views úteis

**Como executar:**
```
1. Mesma aba do SQL Editor
2. LIMPE o editor (delete tudo)
3. Cole TODO o conteúdo do SQL_PRINCIPAL_LIMPO.sql
4. Clique em "Run"
5. Aguarde "Success"
```

---

## 3️⃣ Verificar Super Admin

Execute esta query para confirmar:

```sql
SELECT
  p.id,
  p.name,
  p.role,
  p.is_super_admin,
  au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'contato@aion3.com.br';
```

**Resultado esperado:**
```
is_super_admin: true
role: super_admin
email: contato@aion3.com.br
```

---

## 4️⃣ Criar Assinatura Beto Style

Depois execute: **SQL_CRIAR_ASSINATURA_BETO_STYLE.sql**

(Esse você já tem, está no seu projeto)

---

## 5️⃣ Configurar Chaves Master

Depois execute: **SQL_CONFIGURAR_CHAVES_MASTER.sql**

(Esse você já tem também)

---

## ✅ CHECKLIST

- [ ] Executei SQL_DIAGNOSTICO_E_FIX.sql → Success
- [ ] Executei SQL_PRINCIPAL_LIMPO.sql → Success
- [ ] Verifiquei que super admin está configurado
- [ ] Executei SQL_CRIAR_ASSINATURA_BETO_STYLE.sql
- [ ] Executei SQL_CONFIGURAR_CHAVES_MASTER.sql

---

## ⚠️ SE DER ERRO

**NÃO tente resolver sozinho.**

Me envie:
1. Qual SQL você estava executando (1, 2, 3, 4 ou 5)
2. Mensagem de erro COMPLETA
3. Print se possível

---

**AGORA VAI FUNCIONAR. CONFIA.**
