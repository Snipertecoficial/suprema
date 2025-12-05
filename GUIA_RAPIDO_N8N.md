# ⚡ GUIA RÁPIDO - FAZER N8N FUNCIONAR

**Tempo estimado:** 5-10 minutos

---

## 🎯 PASSO A PASSO COMPLETO

### 1️⃣ EXECUTAR SQL NO SUPABASE (1 minuto)

```sql
-- Abra: https://supabase.com/dashboard/project/SEU_PROJETO/sql

-- Cole e execute este arquivo:
EXECUTAR_NO_SUPABASE_012_N8N_CONFIG.sql
```

✅ **Resultado:** Campos `n8n_url`, `n8n_api_key` e `gemini_api_key` criados na tabela `units`

---

### 2️⃣ OBTER GOOGLE GEMINI API KEY (2 minutos)

1. Acesse: https://makersuite.google.com/app/apikey
2. Clique em "Create API Key"
3. Copie a key (começa com `AIza...`)

✅ **Guarde essa key!** Você vai precisar.

---

### 3️⃣ INSTALAR N8N (Desenvolvimento - opcional)

#### Opção A: n8n Local (para testar)
```bash
# Instalar globalmente
npm install -g n8n

# Iniciar
n8n start

# Acesse: http://localhost:5678
```

#### Opção B: n8n Cloud (produção)
1. Crie conta em: https://n8n.io
2. Crie workspace
3. Anote a URL (ex: https://sua-empresa.app.n8n.cloud)

#### Opção C: n8n Self-Hosted (produção)
```bash
# Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

### 4️⃣ CRIAR API KEY NO N8N (1 minuto)

1. Acesse seu n8n
2. Clique no menu (canto superior direito)
3. Settings → API
4. Clique em "Create API Key"
5. Copie a key gerada (começa com `n8n_api_...`)

✅ **Guarde essa key também!**

---

### 5️⃣ CONFIGURAR NO CRM (2 minutos)

1. **Acesse o CRM:**
   ```
   http://localhost:3000/automacao-n8n
   ```

2. **Preencha os campos:**
   ```
   URL do n8n:        http://localhost:5678  (ou sua URL cloud)
   API Key do n8n:    n8n_api_xxxxxxxxxxx    (criada no passo 4)
   Gemini API Key:    AIzaSy...              (criada no passo 2)
   ```

3. **Clique:** "Salvar e Testar Conexão"

✅ **Você verá:** "✅ Conexão com n8n estabelecida com sucesso!"

---

### 6️⃣ INSTALAR WORKFLOWS (30 segundos)

Na mesma página, você verá 3 workflows:

1. **💬 Recepção de Mensagens WhatsApp**
   - Clique: "Instalar Workflow"
   - Aguarde 2-3 segundos
   - ✅ "Instalado"

2. **📅 Confirmação de Agendamentos**
   - Clique: "Instalar Workflow"
   - Aguarde 2-3 segundos
   - ✅ "Instalado"

3. **🎉 Boas-Vindas Novos Clientes**
   - Clique: "Instalar Workflow"
   - Aguarde 2-3 segundos
   - ✅ "Instalado"

---

### 7️⃣ VERIFICAR NO N8N (1 minuto)

1. Abra seu n8n
2. Veja os 3 workflows criados
3. Todos devem estar com status "Active" (bolinha verde)

✅ **Pronto!** Automação 100% funcionando!

---

## 🧪 TESTAR WORKFLOWS

### Teste 1: Recepção de Mensagens

1. Conecte WhatsApp no CRM (`/whatsapp-connection`)
2. Envie mensagem do seu celular
3. IA deve responder automaticamente

**Como verificar:**
- Vá no n8n → Workflow "Recepção de Mensagens"
- Veja execuções em "Executions"
- Status deve ser "Success" ✅

---

### Teste 2: Confirmação de Agendamento

1. Crie agendamento para amanhã no CRM
2. Aguarde 9h da manhã (ou force execução no n8n)
3. Cliente recebe mensagem de confirmação

**Como forçar execução:**
- Vá no n8n → Workflow "Confirmação de Agendamentos"
- Clique em "Execute Workflow"
- Veja mensagem sendo enviada

---

### Teste 3: Boas-Vindas

1. Cadastre novo cliente no CRM
2. Dispare webhook manualmente:
```bash
curl -X POST http://localhost:3000/api/novo-cliente-webhook \
  -H "Content-Type: application/json" \
  -d '{"client_id": "uuid-do-cliente"}'
```
3. Cliente recebe boas-vindas

---

## ⚠️ TROUBLESHOOTING

### ❌ "Erro ao conectar com n8n"
**Solução:**
- Verifique se n8n está rodando
- Teste URL no navegador
- Verifique API Key

### ❌ "Erro ao criar workflow"
**Solução:**
- Verifique API Key do n8n
- Veja logs no console (F12)
- Tente criar workflow manualmente no n8n

### ❌ "Workflow instalado mas não executa"
**Solução:**
- Verifique se workflow está "Active" no n8n
- Veja "Executions" no n8n para ver erros
- Verifique credenciais (Supabase, Evolution, Gemini)

### ❌ "IA não responde no WhatsApp"
**Soluções:**
1. Verifique Gemini API Key
2. Verifique `pausa_ia = false` na unit
3. Veja execuções no n8n

---

## 📊 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Certifique-se que o `.env.local` tem:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Evolution API (WhatsApp)
NEXT_PUBLIC_EVOLUTION_API_URL=https://sua-evolution.com
NEXT_PUBLIC_EVOLUTION_API_KEY=sua-key
```

**NÃO precisa adicionar:**
- `N8N_URL` (salvo no banco)
- `N8N_API_KEY` (salvo no banco)
- `GEMINI_API_KEY` (salvo no banco)

---

## ✅ CHECKLIST FINAL

Antes de usar, verifique:

- [ ] SQL executado no Supabase
- [ ] n8n instalado e rodando
- [ ] API Key do n8n criada
- [ ] Gemini API Key obtida
- [ ] Configuração salva no CRM
- [ ] 3 workflows instalados
- [ ] Workflows ativos (bolinha verde) no n8n
- [ ] WhatsApp conectado no CRM
- [ ] Teste enviando mensagem

---

## 🎯 RESULTADO ESPERADO

Quando tudo estiver configurado:

1. **Cliente envia mensagem** → **IA responde automaticamente**
2. **Agendamento criado** → **Confirmação enviada amanhã às 9h**
3. **Novo cliente** → **Boas-vindas automáticas**

---

## 📞 PRÓXIMOS PASSOS

Agora você pode:
- Personalizar mensagens nos workflows (editar no n8n)
- Adicionar mais workflows
- Criar triggers customizados
- Ver métricas e logs no n8n

---

**TUDO PRONTO!** 🚀

Seu CRM agora tem automação completa com n8n funcionando.
