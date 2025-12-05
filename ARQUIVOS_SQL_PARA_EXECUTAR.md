# 📂 ARQUIVOS SQL PRONTOS PARA EXECUTAR

Todos os arquivos SQL estão organizados e prontos para copiar e colar no Supabase SQL Editor.

---

## 📋 LISTA DE ARQUIVOS

### ✅ 1. SQL_013_RLS_CONVERSATIONS.sql
**Caminho:** `database/migrations/SQL_013_RLS_CONVERSATIONS.sql`

**O que faz:**
- Completa RLS (Row Level Security) para conversas WhatsApp
- Adiciona isolamento entre unidades
- Cria políticas de segurança

---

### ✅ 2. SQL_014_HORARIOS_FUNCIONAMENTO.sql
**Caminho:** `database/migrations/SQL_014_HORARIOS_FUNCIONAMENTO.sql`

**O que faz:**
- Cria sistema completo de horários de funcionamento
- 4 tabelas novas (business_hours, professional_hours, holidays, time_blocks)
- 3 funções SQL para validação

---

### ✅ 3. SQL_015_FICHAS_TECNICAS.sql
**Caminho:** `database/migrations/SQL_015_FICHAS_TECNICAS.sql`

**O que faz:**
- Cria sistema de fichas técnicas
- Baixa automática de estoque ao finalizar agendamento
- Relatórios de consumo

---

## 🚀 COMO EXECUTAR

1. Abra cada arquivo `.sql` na pasta `database/migrations/`
2. Copie TODO o conteúdo do arquivo
3. Cole no Supabase SQL Editor
4. Execute na ordem: **013 → 014 → 015**
5. Aguarde confirmação de sucesso antes de passar para o próximo

---

## 📍 LOCALIZAÇÃO COMPLETA

```
dashboard-crm/
└── database/
    └── migrations/
        ├── SQL_013_RLS_CONVERSATIONS.sql          ← EXECUTAR PRIMEIRO
        ├── SQL_014_HORARIOS_FUNCIONAMENTO.sql     ← EXECUTAR SEGUNDO
        └── SQL_015_FICHAS_TECNICAS.sql            ← EXECUTAR TERCEIRO
```

---

## 📝 INSTRUÇÕES DETALHADAS

Veja o arquivo `INSTRUCOES_EXECUCAO_SQL.md` para instruções completas passo a passo.

---

**Tudo pronto para executar! 🎉**




