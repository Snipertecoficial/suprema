# ⚡ INSTRUÇÕES RÁPIDAS - EVOLUTION API SAAS

## 🚀 CONFIGURAÇÃO (2 MINUTOS)

### 1. Editar `.env.local`

Na raiz do projeto `dashboard-crm/`, adicione:

```env
NEXT_PUBLIC_EVOLUTION_API_URL=https://ia-evolution-api.zrxigb.easypanel.host
NEXT_PUBLIC_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
```

### 2. Reiniciar Servidor

```bash
# Parar servidor (Ctrl+C se estiver rodando)
npm run dev
```

**Pronto! Tudo funcionando! ✅**

---

## 🎮 COMO USAR (PARA O CLIENTE)

### Conectar WhatsApp:
1. Acesse: `/whatsapp-connection`
2. Clique: **"Conectar WhatsApp"**
3. Escaneie: QR Code que aparece
4. ✅ **Conectado!**

### Reconectar:
1. Clique: **"Reconectar"** ou **"Conectar WhatsApp"**
2. Escaneie: Novo QR Code
3. ✅ **Reconectado!**

### Desconectar:
1. Clique: **"Desconectar WhatsApp"**
2. Confirme
3. ✅ **Desconectado!**

---

## ✅ O QUE ESTÁ FUNCIONANDO

- ✅ Cada cliente tem sua própria instância WhatsApp
- ✅ Geração automática de instância (sem config manual)
- ✅ QR Code aparece com 1 clique
- ✅ Conexão detectada automaticamente
- ✅ Webhook configurado automaticamente
- ✅ Mensagens sendo recebidas e enviadas
- ✅ Isolamento total entre clientes

---

## 📁 ARQUIVOS IMPORTANTES

- `lib/services/evolutionAPI.ts` - Serviço Evolution API
- `app/whatsapp-connection/page.tsx` - Página de conexão
- `app/api/webhooks/evolution/route.ts` - Webhook handler

---

## 📚 DOCUMENTAÇÃO COMPLETA

Veja `docs/SOLUCAO_COMPLETA_EVOLUTION_SAAS.md` para detalhes técnicos.

---

**Tudo pronto! Configure as variáveis e está funcionando! 🎉**




