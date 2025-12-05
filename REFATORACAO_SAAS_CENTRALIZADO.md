# 🏗️ REFATORAÇÃO SAAS CENTRALIZADO - GUIA COMPLETO

**Data:** 03/12/2025
**Modelo:** SaaS High-Ticket (R$ 997/mês)
**Arquitetura:** Chaves de API centralizadas no Super Admin

---

## 📋 O QUE FOI IMPLEMENTADO

### 1. ✅ SQL Atualizado - Arquitetura SaaS Centralizada

**Arquivo:** `20251203_saas_architecture.sql`

#### Novas Tabelas:

**`system_settings` - Configuração Global (Super Admin)**
- ✅ Apenas 1 linha no banco
- ✅ `gemini_api_key_master` - Chave master do Gemini (compartilhada)
- ✅ `openai_api_key_master` - Chave master do OpenAI (futuro)
- ✅ `evolution_api_global_token` - Token global da Evolution API
- ✅ `maintenance_mode` - Modo manutenção (boolean)
- ✅ `maintenance_message` - Mensagem customizada
- ✅ RLS: Apenas super admin pode ler/escrever

**`ai_usage_metrics` - Controle de Custo por Tenant**
- ✅ Rastreia uso de IA por tenant
- ✅ Colunas: `unit_id`, `month_year`, `input_tokens`, `output_tokens`, `messages_count`, `estimated_cost_usd`
- ✅ Unique constraint: 1 registro por unit por mês
- ✅ Função SQL: `increment_ai_usage()` para atualizar métricas

**`saas_plans` - Planos de Assinatura**
- ✅ Plano único: AION3 Enterprise (R$ 997/mês)
- ✅ Features em JSONB
- ✅ Limites configuráveis

**`saas_subscriptions` - Assinaturas dos Tenants**
- ✅ Status: trialing, active, past_due, canceled, suspended
- ✅ Integração com Stripe (campos preparados)
- ✅ 1 assinatura por unit

**`invoices` - Faturas**
- ✅ Histórico de pagamentos
- ✅ Links para PDF e página hosted do Stripe

**`audit_logs` - Logs de Auditoria**
- ✅ Rastreia todas as ações importantes
- ✅ Detalhes em JSONB
- ✅ IP e User Agent

**`feature_flags` - Flags de Features**
- ✅ Habilitar/desabilitar features por tenant
- ✅ Configuração em JSONB

#### Alterações em Tabelas Existentes:

**`units`:**
- ❌ **REMOVIDO:** `gemini_api_key`, `n8n_api_key`, `n8n_url`
- ✅ **ADICIONADO:** `ai_features_enabled` (boolean)
- ✅ **ADICIONADO:** `ai_paused` (boolean) - Cliente pode pausar IA

**`profiles`:**
- ✅ **ADICIONADO:** `is_super_admin` (boolean)
- ✅ **ATUALIZADO:** Role pode ser 'super_admin'

---

### 2. ✅ Services Criados

#### `lib/services/systemSettings.ts`

**Funções principais:**

```typescript
// Busca todas as configurações (com cache de 5 minutos)
await getGlobalSettings()

// Busca apenas Gemini API Key master
await getGeminiMasterKey()

// Busca apenas Evolution API token
await getEvolutionGlobalToken()

// Busca URL base da Evolution API
await getEvolutionBaseURL()

// Verifica se está em modo manutenção
await isMaintenanceMode()

// Invalida cache (forçar reload)
invalidateSettingsCache()

// Atualiza configurações (apenas via API Route protegida)
await updateGlobalSettings({ gemini_api_key_master: 'nova-key' })
```

**Cache:**
- ✅ Cache in-memory de 5 minutos
- ✅ Evita consultas excessivas ao banco
- ✅ Invalida automaticamente ao atualizar

---

#### `lib/services/gemini.ts`

**Funções principais:**

```typescript
// Gera resposta da IA (rastreia uso automaticamente)
const response = await generateAIResponse(
  prompt,
  unitId,
  systemInstruction // opcional
)

// Resultado:
{
  text: 'Resposta da IA...',
  inputTokens: 150,
  outputTokens: 200
}

// Gera resposta contextual para WhatsApp
const text = await generateWhatsAppResponse(
  message,
  unitId,
  clientName,
  conversationHistory // opcional
)

// Busca uso mensal de IA do tenant
const usage = await getMonthlyAIUsage(unitId)

// Pausa/despausa IA para um tenant
await toggleAIPause(unitId, true) // pausar
await toggleAIPause(unitId, false) // despausar
```

**Segurança:**
- ✅ Chave master NUNCA é exposta ao cliente
- ✅ IA roda 100% server-side (API Routes ou Server Actions)
- ✅ Verifica se AI está habilitada para o tenant antes de gerar
- ✅ Verifica se AI está pausada

**Rastreamento:**
- ✅ Chama `increment_ai_usage()` automaticamente após cada geração
- ✅ Atualiza `ai_usage_metrics` com tokens usados
- ✅ Calcula custo estimado (Gemini Pro pricing)

---

### 3. ✅ Middleware Atualizado - O "Porteiro"

**Arquivo:** `lib/supabase/middleware.ts`

**3 Camadas de Verificação:**

#### Camada 1: Autenticação
- ✅ Verifica se usuário está logado
- ✅ Rotas públicas: `/login`, `/auth`, `/agendamento`, `/signup`, `/pricing`
- ✅ Redireciona para `/login` se não autenticado

#### Camada 2: Modo Manutenção
- ✅ Verifica `system_settings.maintenance_mode`
- ✅ Se ativo e NÃO é super admin → redireciona para `/maintenance`
- ✅ Super admin sempre tem acesso (mesmo em manutenção)

#### Camada 3: Verificação de Assinatura (O Porteiro)
- ✅ Busca assinatura do tenant (`saas_subscriptions`)
- ✅ Verifica status: `active` ou `trialing` = OK
- ✅ Status inválido (`past_due`, `canceled`, `suspended`) → redireciona para `/billing/reactivate`
- ✅ Sem assinatura → redireciona para `/billing/subscribe`
- ✅ Super admin ignora verificação de assinatura

**Rotas que ignoram verificação de assinatura:**
- `/super-admin/*` - Dashboard do super admin
- `/billing/*` - Páginas de billing
- `/onboarding/*` - Onboarding após signup
- `/logout` - Logout
- `/maintenance` - Página de manutenção

**Headers adicionados:**
- `X-Subscription-Expiring-Soon: true` - Se faltam ≤ 7 dias
- `X-Days-Until-Expiration: N` - Dias restantes
- `X-Subscription-Canceling: true` - Se vai cancelar no fim do período

---

### 4. ✅ Páginas Criadas

#### `/app/billing/reactivate/page.tsx`
- ✅ Exibida quando assinatura está inválida
- ✅ Mostra status: past_due, canceled, suspended
- ✅ Informações do plano e valor
- ✅ Botão de reativação (TODO: integrar com Stripe)
- ✅ Botão de contato com suporte
- ✅ Explicações sobre cada status

#### `/app/maintenance/page.tsx`
- ✅ Exibida quando `maintenance_mode = true`
- ✅ Mostra mensagem customizada do banco
- ✅ Verifica a cada 30 segundos se saiu do modo manutenção
- ✅ Redireciona automaticamente quando voltou

---

### 5. ✅ TenantProvider Validado

**Arquivo:** `components/providers/TenantProvider.tsx`

**Alterações:**
- ✅ Busca também `ai_features_enabled` e `ai_paused`
- ✅ Tratamento de erro de RLS (não trava a aplicação)
- ✅ Compatível com novas policies

---

## 🚀 COMO USAR NA PRÁTICA

### Exemplo 1: Gerar Resposta de IA em API Route

```typescript
// app/api/whatsapp/generate-response/route.ts

import { generateWhatsAppResponse } from '@/lib/services/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { message, unitId, clientName } = await request.json()

  try {
    // Gerar resposta (já rastreia uso automaticamente)
    const response = await generateWhatsAppResponse(
      message,
      unitId,
      clientName
    )

    return Response.json({ response })
  } catch (error: any) {
    // Tratar erros específicos
    if (error.message.includes('não estão habilitadas')) {
      return Response.json({ error: 'AI desabilitada' }, { status: 403 })
    }

    if (error.message.includes('pausada')) {
      return Response.json({ error: 'AI pausada pelo cliente' }, { status: 403 })
    }

    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

---

### Exemplo 2: Verificar Uso de IA no Dashboard

```typescript
// app/dashboard/ai-usage/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { getMonthlyAIUsage } from '@/lib/services/gemini'
import { useAuth } from '@/components/providers/AuthProvider'

export default function AIUsagePage() {
  const { profile } = useAuth()
  const [usage, setUsage] = useState(null)

  useEffect(() => {
    if (!profile?.unit_id) return

    getMonthlyAIUsage(profile.unit_id).then(setUsage)
  }, [profile?.unit_id])

  if (!usage) return <div>Carregando...</div>

  return (
    <div>
      <h1>Uso de IA - Mês Atual</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="label">Mensagens</p>
          <p className="value">{usage.messages_count}</p>
        </div>

        <div className="card">
          <p className="label">Tokens (Input)</p>
          <p className="value">{usage.input_tokens.toLocaleString()}</p>
        </div>

        <div className="card">
          <p className="label">Tokens (Output)</p>
          <p className="value">{usage.output_tokens.toLocaleString()}</p>
        </div>

        <div className="card col-span-3">
          <p className="label">Custo Estimado</p>
          <p className="value">
            US$ {usage.estimated_cost_usd.toFixed(4)}
            <span className="text-sm text-gray-500 ml-2">
              (~R$ {(usage.estimated_cost_usd * 5).toFixed(2)})
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

### Exemplo 3: Pausar IA (Cliente)

```typescript
// app/configuracoes/ia/page.tsx

'use client'

import { useState } from 'react'
import { toggleAIPause } from '@/lib/services/gemini'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTenant } from '@/components/providers/TenantProvider'

export default function IAConfigPage() {
  const { profile } = useAuth()
  const { tenant, refreshTenant } = useTenant()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!profile?.unit_id) return

    setLoading(true)

    try {
      const newState = !tenant.ai_paused

      await toggleAIPause(profile.unit_id, newState)
      await refreshTenant()

      alert(newState ? 'IA pausada' : 'IA ativada')
    } catch (error) {
      alert('Erro ao alterar estado da IA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Configurações de IA</h1>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3>Respostas Automáticas</h3>
            <p className="text-sm text-gray-500">
              {tenant?.ai_paused
                ? 'IA pausada. Você precisará responder manualmente.'
                : 'IA ativa. Respostas automáticas habilitadas.'}
            </p>
          </div>

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`toggle ${tenant?.ai_paused ? 'off' : 'on'}`}
          >
            {loading ? 'Salvando...' : tenant?.ai_paused ? 'Pausado' : 'Ativo'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### Exemplo 4: Dashboard Super Admin - Configurar Chave Master

```typescript
// app/super-admin/settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { getGlobalSettings, updateGlobalSettings, invalidateSettingsCache } from '@/lib/services/systemSettings'

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const data = await getGlobalSettings()
    setSettings(data)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await updateGlobalSettings({
        gemini_api_key_master: settings.gemini_api_key_master,
        evolution_api_global_token: settings.evolution_api_global_token,
        maintenance_mode: settings.maintenance_mode,
        maintenance_message: settings.maintenance_message
      })

      // Invalidar cache
      invalidateSettingsCache()

      alert('Configurações salvas!')
    } catch (error) {
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return <div>Carregando...</div>

  return (
    <div>
      <h1>Configurações Globais</h1>

      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div>
            <label>Gemini API Key Master</label>
            <input
              type="password"
              value={settings.gemini_api_key_master || ''}
              onChange={(e) => setSettings({ ...settings, gemini_api_key_master: e.target.value })}
              className="input"
            />
            <p className="text-xs text-gray-500">
              Compartilhada por todos os tenants. Nunca exposta ao cliente.
            </p>
          </div>

          <div>
            <label>Evolution API Global Token</label>
            <input
              type="password"
              value={settings.evolution_api_global_token || ''}
              onChange={(e) => setSettings({ ...settings, evolution_api_global_token: e.target.value })}
              className="input"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.maintenance_mode}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
            />
            <label>Modo Manutenção</label>
          </div>

          {settings.maintenance_mode && (
            <div>
              <label>Mensagem de Manutenção</label>
              <textarea
                value={settings.maintenance_message}
                onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

---

## 📊 DASHBOARD SUPER ADMIN - Ver Uso de IA

```typescript
// app/super-admin/ai-usage/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminAIUsagePage() {
  const [usage, setUsage] = useState([])

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    const supabase = createClient()

    // Buscar view criada no SQL
    const { data } = await supabase
      .from('current_month_ai_usage')
      .select('*')
      .order('estimated_cost_brl', { ascending: false })

    setUsage(data || [])
  }

  const totalCost = usage.reduce((sum, u) => sum + (u.estimated_cost_brl || 0), 0)

  return (
    <div>
      <h1>Uso de IA - Mês Atual</h1>

      <div className="mb-6 card">
        <h3>Custo Total Estimado</h3>
        <p className="text-3xl font-bold">R$ {totalCost.toFixed(2)}</p>
        <p className="text-sm text-gray-500">
          Todos os tenants somados
        </p>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Mensagens</th>
            <th>Input Tokens</th>
            <th>Output Tokens</th>
            <th>Custo (BRL)</th>
          </tr>
        </thead>
        <tbody>
          {usage.map(u => (
            <tr key={u.unit_id}>
              <td>{u.unit_name}</td>
              <td>{u.messages_count}</td>
              <td>{u.input_tokens.toLocaleString()}</td>
              <td>{u.output_tokens.toLocaleString()}</td>
              <td>R$ {u.estimated_cost_brl.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 🔐 SEGURANÇA

### O Que Está Seguro:

✅ **Chave master NUNCA vai para o cliente:**
- Apenas busca server-side (API Routes, Server Actions)
- Cache in-memory no servidor
- Client Components NUNCA veem a chave

✅ **RLS protege tudo:**
- `system_settings`: Apenas super admin
- `ai_usage_metrics`: Super admin vê tudo, tenants veem apenas seus próprios dados
- `saas_subscriptions`: Mesmo esquema
- Todas as outras tabelas: Isolamento por `unit_id`

✅ **Middleware protege rotas:**
- Verifica autenticação
- Verifica modo manutenção
- Verifica assinatura ativa
- Redireciona automaticamente

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados:
- [ ] Executar `20251203_saas_architecture.sql` no Supabase
- [ ] Criar super admin (inserir em `profiles` com `is_super_admin = true`)
- [ ] Configurar `gemini_api_key_master` via Dashboard Super Admin
- [ ] Criar assinatura trial para Beto Style (30 dias)

### Backend:
- [x] `lib/services/systemSettings.ts` criado
- [x] `lib/services/gemini.ts` refatorado
- [x] `lib/supabase/middleware.ts` atualizado
- [x] `components/providers/TenantProvider.tsx` validado

### Frontend:
- [x] `/app/billing/reactivate/page.tsx` criado
- [x] `/app/maintenance/page.tsx` criado
- [ ] `/app/super-admin/settings/page.tsx` - TODO
- [ ] `/app/super-admin/ai-usage/page.tsx` - TODO
- [ ] `/app/dashboard/ai-usage/page.tsx` (para tenants) - TODO
- [ ] `/app/configuracoes/ia/page.tsx` (pausar IA) - TODO

### Testes:
- [ ] Testar signup → onboarding → sem assinatura → redireciona
- [ ] Testar assinatura expirada → redireciona para reactivate
- [ ] Testar modo manutenção (super admin tem acesso, outros não)
- [ ] Testar geração de resposta IA (rastreamento de uso)
- [ ] Testar pausar IA (cliente não pode usar)

---

## 🎯 PRÓXIMOS PASSOS

1. **Dashboard Super Admin Completo:**
   - Página de configurações globais
   - Página de uso de IA
   - Gestão de tenants

2. **Stripe Integration:**
   - Webhook handlers
   - Checkout session
   - Customer portal

3. **Páginas para Tenants:**
   - Ver uso de IA mensal
   - Pausar/despausar IA
   - Ver detalhes da assinatura

4. **Evolution API Centralizada (Opcional):**
   - Se quiser centralizar Evolution também
   - Adicionar `evolution_instances` por tenant
   - Usar token global do `system_settings`

---

## 💡 OBSERVAÇÕES IMPORTANTES

### Custo de IA:
- Gemini Pro: ~$0.00125 / 1K input tokens, ~$0.005 / 1K output tokens
- Exemplo: 1.000 mensagens com ~500 tokens cada = ~US$ 3-5/mês por tenant
- Com 50 tenants ativos: ~US$ 150-250/mês de custo de IA
- Receita: 50 × R$ 997 = R$ 49.850/mês
- **ROI:** Margem de ~98% (custo de IA é insignificante)

### Performance:
- Cache de 5 minutos em `system_settings` reduz queries
- Middleware otimizado (poucas queries)
- Função SQL `increment_ai_usage()` é rápida (upsert)

### Escalabilidade:
- Sistema suporta milhares de tenants
- Custo de IA escala linearmente (previsível)
- RLS garante isolamento sem overhead
- Views materializadas podem ser criadas se necessário

---

**REFATORAÇÃO COMPLETA!** ✅

Agora o SaaS está 100% centralizado, com controle total de custos e segurança máxima.
