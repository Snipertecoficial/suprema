# 📋 INSTRUÇÕES PARA EXECUTAR AS MIGRAÇÕES SQL NO SUPABASE

## 🎯 ORDEM DE EXECUÇÃO

Execute os scripts SQL na **ordem numerada** abaixo, um de cada vez no Supabase SQL Editor.

---

## 1️⃣ MIGRAÇÃO 013 - RLS PARA CONVERSATIONS

**Arquivo:** `database/migrations/SQL_013_RLS_CONVERSATIONS.sql`

**O que faz:**
- Habilita RLS (Row Level Security) em conversas WhatsApp
- Cria políticas de segurança para isolamento entre unidades
- Adiciona `unit_id` em conversations se não existir
- Cria índices para performance

**Como executar:**
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie todo o conteúdo do arquivo `SQL_013_RLS_CONVERSATIONS.sql`
4. Cole no editor
5. Clique em **RUN** ou pressione `Ctrl+Enter`
6. Aguarde a confirmação de sucesso

---

## 2️⃣ MIGRAÇÃO 014 - HORÁRIOS DE FUNCIONAMENTO

**Arquivo:** `database/migrations/SQL_014_HORARIOS_FUNCIONAMENTO.sql`

**O que faz:**
- Cria 4 tabelas: `business_hours`, `professional_hours`, `holidays`, `time_blocks`
- Cria 3 funções SQL para validação de horários
- Habilita RLS em todas as tabelas
- Cria triggers para atualizar timestamps

**Como executar:**
1. No Supabase SQL Editor
2. Copie todo o conteúdo do arquivo `SQL_014_HORARIOS_FUNCIONAMENTO.sql`
3. Cole no editor
4. Clique em **RUN**
5. Aguarde a confirmação

---

## 3️⃣ MIGRAÇÃO 015 - FICHAS TÉCNICAS

**Arquivo:** `database/migrations/SQL_015_FICHAS_TECNICAS.sql`

**O que faz:**
- Cria tabelas: `service_formulas` e `service_consumption`
- Cria função para baixa automática de estoque
- Cria trigger que dispara ao finalizar agendamento
- Cria funções para verificar estoque e relatórios
- Habilita RLS

**Como executar:**
1. No Supabase SQL Editor
2. Copie todo o conteúdo do arquivo `SQL_015_FICHAS_TECNICAS.sql`
3. Cole no editor
4. Clique em **RUN**
5. Aguarde a confirmação

---

## ✅ VERIFICAÇÃO APÓS EXECUÇÃO

### Verificar se as tabelas foram criadas:

```sql
-- Verificar tabelas de horários
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'business_hours', 
    'professional_hours', 
    'holidays', 
    'time_blocks',
    'service_formulas',
    'service_consumption'
  );
```

### Verificar se as políticas RLS foram criadas:

```sql
-- Verificar políticas de conversations
SELECT * FROM pg_policies 
WHERE tablename = 'conversations';
```

### Verificar se as funções foram criadas:

```sql
-- Verificar funções de horários
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'is_within_business_hours',
    'is_professional_available',
    'has_time_block',
    'verificar_estoque_servico',
    'relatorio_consumo_produtos'
  );
```

---

## ⚠️ IMPORTANTE

1. **Faça backup** do banco antes de executar
2. **Execute na ordem** (013 → 014 → 015)
3. **Aguarde cada execução terminar** antes de iniciar a próxima
4. **Verifique se há erros** na aba de logs
5. **Em caso de erro**, pare e revise antes de continuar

---

## 📁 LOCALIZAÇÃO DOS ARQUIVOS

Todos os arquivos SQL estão em:
```
dashboard-crm/database/migrations/
```

- `SQL_013_RLS_CONVERSATIONS.sql`
- `SQL_014_HORARIOS_FUNCIONAMENTO.sql`
- `SQL_015_FICHAS_TECNICAS.sql`

---

## 🆘 EM CASO DE PROBLEMAS

Se algum script falhar:

1. Verifique os logs de erro no Supabase
2. Verifique se as funções auxiliares existem:
   - `get_my_unit_id()`
   - `get_my_role()`
3. Verifique se as tabelas base existem:
   - `units`
   - `profiles`
   - `conversations`

Se precisar de ajuda, me avise!

---

**Boa sorte! 🚀**




