# 🔧 VARIÁVEIS DE AMBIENTE - CONFIGURAÇÃO COMPLETA

## 📋 ARQUIVO .env.local

Crie o arquivo `.env.local` na raiz do projeto `dashboard-crm/` com as seguintes variáveis:

```env
# ============================================
# EVOLUTION API - CONFIGURAÇÃO SAAS WHITE LABEL
# ============================================

# URL do servidor Evolution API (seu Easypanel)
NEXT_PUBLIC_EVOLUTION_API_URL=https://ia-evolution-api.zrxigb.easypanel.host

# API Key do Evolution API (autenticação)
NEXT_PUBLIC_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# ============================================
# SUPABASE - CONFIGURAÇÃO DO BANCO DE DADOS
# ============================================

# URL do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública (anon key) do Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Chave de serviço (service role key) - NÃO EXPOR NO CLIENTE!
# Usada apenas no servidor (API routes, webhooks)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# ============================================
# OUTRAS CONFIGURAÇÕES (OPCIONAIS)
# ============================================

# n8n Webhook URL (para automações - opcional)
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/processar-mensagem

# Google Gemini API Key (para chatbot - futuro)
GOOGLE_GEMINI_API_KEY=sua-chave-gemini-aqui
```

---

## ✅ VARIÁVEIS OBRIGATÓRIAS

Para o Evolution API funcionar, você **PRECISA** configurar:

1. ✅ `NEXT_PUBLIC_EVOLUTION_API_URL` = `https://ia-evolution-api.zrxigb.easypanel.host`
2. ✅ `NEXT_PUBLIC_EVOLUTION_API_KEY` = `429683C4C977415CAAFCCE10F7D57E11`

---

## 📝 COMO CONFIGURAR

### 1. Criar arquivo `.env.local`:

```bash
cd dashboard-crm
touch .env.local
```

### 2. Adicionar conteúdo:

Copie o conteúdo acima e cole no arquivo `.env.local`, preenchendo:
- URLs do Supabase (já deve ter)
- Chaves do Supabase (já deve ter)
- URLs e chaves opcionais (n8n, Gemini)

### 3. Reiniciar servidor:

```bash
# Parar servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

---

## ⚠️ IMPORTANTE

1. **Nunca commite** o arquivo `.env.local` no Git
2. **Variáveis NEXT_PUBLIC_*** são expostas no cliente (navegador)
3. **Variáveis sem NEXT_PUBLIC_*** são apenas no servidor (mais seguras)
4. **Após alterar**, sempre reinicie o servidor Next.js

---

## 🚀 DEPLOY EM PRODUÇÃO

No seu servidor de produção (Vercel, Railway, etc):

1. Acesse as configurações do projeto
2. Vá em "Environment Variables"
3. Adicione todas as variáveis acima
4. Faça redeploy do projeto

---

**Tudo configurado! Agora é só usar! 🎉**




