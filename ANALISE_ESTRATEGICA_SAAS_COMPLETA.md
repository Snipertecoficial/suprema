# 🚀 ANÁLISE ESTRATÉGICA COMPLETA - SAAS WHITE LABEL CRM

**Data:** 03/12/2025
**Documento:** Análise Profunda do Negócio
**Autor:** Super Admin - contato@aion3.com.br

---

## 📊 EXECUTIVE SUMMARY

Seu SaaS é uma **plataforma CRM White Label multi-tenant** voltada para o mercado de beleza e bem-estar (salões, clínicas de estética, podologias, barbearias).

**Diferencial Principal:** Sistema completo com WhatsApp integrado, automação via n8n, IA generativa e personalização visual - tudo em modo plug-and-play.

**Primeiro Cliente Ativo:** styleb251@gmail.com (Beto Style)
**Super Admin:** contato@aion3.com.br

**Status Atual:** 85% pronto para lançamento comercial
**Missing:** Dashboard super admin, billing/Stripe, signup automático, analytics

---

## 🎯 O QUE SEU SAAS ENTREGA (INVENTÁRIO COMPLETO)

### 1. **CRM Completo para Clientes**

#### Gestão de Clientes
- ✅ Cadastro completo (nome, telefone, email, endereço, CPF)
- ✅ Histórico de atendimentos
- ✅ Tags e segmentação
- ✅ Notas privadas
- ✅ Busca e filtros avançados
- ✅ Importação de clientes (CSV)
- ✅ Exportação de dados

#### Agendamentos Online V2
- ✅ Calendário visual interativo
- ✅ Disponibilidade configurável (horários, dias bloqueados)
- ✅ Múltiplos profissionais
- ✅ Serviços com duração e preço
- ✅ Confirmação automática via WhatsApp
- ✅ Lembretes 1 dia antes
- ✅ Status: pendente, confirmado, cancelado, concluído
- ✅ Gestão de conflitos de horário

#### Catálogo de Serviços
- ✅ Cadastro ilimitado de serviços
- ✅ Preço, duração, descrição
- ✅ Categorização
- ✅ Ativar/desativar serviços

#### Gestão de Produtos (Estoque)
- ✅ Cadastro de produtos
- ✅ Controle de estoque
- ✅ Alertas de estoque baixo
- ✅ Categorias
- ✅ Preço de custo e venda

#### Financeiro
- ✅ Métodos de pagamento configuráveis
- ✅ Registro de transações
- ✅ Comissões por profissional
- ✅ Relatórios de receita
- ✅ Dashboard financeiro

#### Equipe (Team)
- ✅ Cadastro de profissionais
- ✅ Permissões por função (admin, atendente, profissional)
- ✅ Horários de trabalho
- ✅ Comissões

---

### 2. **WhatsApp Business Integrado**

#### Evolution API Integration
- ✅ **Uma instância WhatsApp por tenant** (isolamento total)
- ✅ Geração de QR Code dinâmico
- ✅ Status de conexão real-time
- ✅ Reconexão automática
- ✅ **Reset de instância** (botão para resolver QR Code expirado)
- ✅ Webhook configurado automaticamente
- ✅ Roteamento inteligente por instance_name

#### Mensageria
- ✅ Envio de mensagens individuais
- ✅ Envio em massa (broadcast)
- ✅ Templates de mensagem
- ✅ Histórico completo de conversas
- ✅ Salva mensagens no banco (tabela `conversations`)
- ✅ Roteamento por tenant via `unit_id`

#### Painel de Conversas
- ✅ Interface tipo WhatsApp Web
- ✅ Listagem de conversas ativas
- ✅ Indicador de mensagens não lidas
- ✅ Busca por cliente
- ✅ Envio e recebimento real-time

---

### 3. **Automação com n8n (Plug-and-Play)**

#### Sistema de Importação Automática
- ✅ **3 workflows prontos** em JSON
- ✅ Página de configuração `/automacao-n8n`
- ✅ Instalação com **1 clique** por workflow
- ✅ Substituição automática de credenciais
- ✅ Ativação automática dos workflows

#### Workflow 1: Recepção de Mensagens WhatsApp 💬
**Funcionalidade:**
- Recebe mensagem do cliente via webhook
- Identifica tenant automaticamente
- Busca cliente no banco
- Verifica se IA está ativa (`pausa_ia = false`)
- Google Gemini gera resposta contextual
- Envia resposta automática
- Salva conversa no banco

**Nodes:**
- Webhook (Trigger)
- IF (Filtro de mensagens)
- Supabase (Buscar unit e cliente)
- IF (Verificar IA ativa)
- HTTP Request (Google Gemini)
- Evolution API (Enviar resposta)
- Supabase (Salvar resposta)

#### Workflow 2: Confirmação de Agendamento 📅
**Funcionalidade:**
- Executa todo dia às 9h (cron)
- Busca agendamentos de amanhã
- Envia confirmação via WhatsApp
- Atualiza status para `pending_confirmation`

**Exemplo de mensagem:**
```
Olá João! Confirmando seu horário amanhã:

🗓 Dia: 04/12/2025
⏰ Horário: 14:00
💇 Serviço: Corte de Cabelo
👨‍💼 Profissional: Carlos

Confirma? Responda SIM ou NÃO.
```

#### Workflow 3: Boas-Vindas Novos Clientes 🎉
**Funcionalidade:**
- Dispara quando novo cliente se cadastra (webhook)
- Envia boas-vindas personalizadas
- Aguarda 2 segundos (humanização)
- Oferece agendamento online
- Marca como enviado (`welcome_sent_at`)

**Exemplo de mensagem:**
```
Olá Maria! Bem-vinda ao Beto Style! 🎉

Ficamos muito felizes em ter você conosco!

Quer agendar seu primeiro atendimento?
Temos horários disponíveis essa semana!
```

#### Configuração Plug-and-Play
**Cliente precisa fornecer apenas:**
1. URL do n8n (ex: https://n8n.empresa.com ou http://localhost:5678)
2. API Key do n8n (gerada em Settings → API)
3. Gemini API Key (grátis em https://makersuite.google.com/app/apikey)

**Sistema faz automaticamente:**
- Testa conexão com n8n
- Salva credenciais no banco (tabela `units`)
- Substitui placeholders nos workflows:
  - `{{SUPABASE_URL}}` → URL real
  - `{{SUPABASE_KEY}}` → Service role key
  - `{{EVOLUTION_API_URL}}` → URL Evolution
  - `{{EVOLUTION_API_KEY}}` → Key Evolution
  - `{{GEMINI_API_KEY}}` → Key Gemini
- Cria workflows via n8n API
- Ativa workflows automaticamente

---

### 4. **White Label (Personalização Visual)**

#### Branding por Tenant
- ✅ **Upload de logo** (Supabase Storage)
  - Validação de tipo (apenas imagens)
  - Validação de tamanho (máx 2MB)
  - Preview em tempo real
  - Pasta isolada por tenant (`unit_id/logo-timestamp.ext`)
  - URL pública automática

- ✅ **Customização de cores:**
  - Cor primária (buttons, links)
  - Cor secundária (texto secundário)
  - Cor de destaque (badges, notificações)
  - Background da sidebar
  - Cor de texto

- ✅ **Nome da marca:** Substituição em toda interface

#### Aplicação do Tema
- ✅ ThemeProvider com Context API
- ✅ CSS Custom Properties (`--primary-color`, etc.)
- ✅ Logo na sidebar
- ✅ Cores aplicadas globalmente
- ✅ **Real-time updates:** Mudança de tema reflete instantaneamente
- ✅ Supabase Realtime subscription em `units` table

#### Interface Personalizada
- Sidebar com logo e brand name
- Gradientes com cores do tenant
- Botões com cor primária
- Todos os elementos respeitam o tema

---

### 5. **Multi-Tenancy (Arquitetura SaaS)**

#### Isolamento Total
- ✅ Tabela `units` - Um registro por tenant
- ✅ `unit_id` em **todas as tabelas**
- ✅ Row Level Security (RLS) ativado
- ✅ Policies garantem isolamento

**Exemplo de Policy:**
```sql
CREATE POLICY "Users manage data from their unit"
ON clients FOR ALL
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

#### Geração Automática de Instance Name
- ✅ Função SQL `generate_instance_name()`
- ✅ Pattern: `crm-{slug}`
- ✅ Slug gerado automaticamente do nome da unit
- ✅ Garante unicidade entre tenants

**Exemplo:**
```
Unit: "Beto Style" → slug: "beto-style" → instance: "crm-beto-style"
Unit: "Clínica Bella" → slug: "clinica-bella" → instance: "crm-clinica-bella"
```

#### Dados Isolados
**Cada tenant tem:**
- Seus próprios clientes
- Seus próprios agendamentos
- Sua própria instância WhatsApp
- Suas próprias conversas
- Seus próprios serviços/produtos
- Sua própria personalização visual
- Seus próprios workflows n8n (opcionalmente)

**Impossível:**
- Tenant A ver clientes do Tenant B
- Mensagem de Tenant A ir para Tenant B
- Logo de Tenant A aparecer para Tenant B

---

### 6. **Setup Facilitado (Plug-and-Play)**

#### Página de Setup de Banco `/setup-database`
- ✅ **5 scripts SQL prontos:**
  1. Tabelas principais (units, profiles, clients, services, products)
  2. Agendamentos (appointments, availability, booking_config)
  3. WhatsApp (whatsapp_instances, conversations)
  4. Financeiro (payment_methods, transactions, commissions)
  5. RLS (policies multi-tenant)

- ✅ Botão "Copiar Tudo" - Setup completo em 1 paste
- ✅ Botão "Download" individual
- ✅ Syntax highlighting
- ✅ Instruções passo a passo

#### Onboarding do Cliente
**Processo atual (manual):**
1. Você cria unit no banco
2. Você cria usuário no Supabase Auth
3. Você cria profile associando user → unit
4. Cliente faz login
5. Cliente configura WhatsApp
6. Cliente personaliza visual
7. Cliente instala workflows n8n

**Tempo:** ~15 minutos por cliente

---

### 7. **Segurança e Performance**

#### Autenticação
- ✅ Supabase Auth (JWT)
- ✅ Email + senha
- ✅ Session management
- ✅ Protected routes (middleware)

#### Autorização
- ✅ RLS (Row Level Security)
- ✅ Service Role Key para webhooks (bypass RLS quando necessário)
- ✅ Policies por tenant

#### Performance
- ✅ Índices em campos chave (`unit_id`, `instance_name`, `phone`)
- ✅ Supabase Realtime para updates instantâneos
- ✅ Next.js 16 com Turbopack (build 10x mais rápido)
- ✅ Caching de temas

#### Armazenamento
- ✅ Supabase Storage para logos
- ✅ Buckets com RLS
- ✅ Public URLs
- ✅ Organização por tenant

---

## ❌ O QUE AINDA FALTA (Missing Resources)

### 1. **Dashboard Super Admin** ⚠️ CRÍTICO

**O que precisa:**

#### Visão Geral
- [ ] Total de tenants ativos
- [ ] Total de usuários cadastrados
- [ ] Receita total (MRR - Monthly Recurring Revenue)
- [ ] Churn rate (taxa de cancelamento)
- [ ] Tenants criados este mês
- [ ] Gráfico de crescimento (últimos 6 meses)

#### Gestão de Tenants
- [ ] Listar todos os tenants
- [ ] Buscar por nome, email, slug
- [ ] Ver status: ativo, trial, suspenso, cancelado
- [ ] Ver data de criação, último acesso
- [ ] Ver plano contratado
- [ ] Ver uso de recursos (clientes, mensagens, storage)
- [ ] **Impersonation:** Fazer login como tenant (suporte)
- [ ] Suspender/ativar tenant
- [ ] Deletar tenant (soft delete)

#### Gestão de Assinaturas
- [ ] Ver plano de cada tenant
- [ ] Ver status de pagamento
- [ ] Ver histórico de faturas
- [ ] Ver próxima cobrança
- [ ] Alterar plano manualmente
- [ ] Aplicar desconto/cupom
- [ ] Cancelar assinatura
- [ ] Reativar assinatura

#### Analytics e Métricas
- [ ] Top 10 tenants por receita
- [ ] Top 10 tenants por uso (mensagens)
- [ ] Distribuição por plano
- [ ] Gráfico de novos signups
- [ ] Gráfico de cancelamentos
- [ ] LTV (Lifetime Value) médio
- [ ] CAC (Customer Acquisition Cost)
- [ ] Saúde financeira (MRR vs churn)

#### System Health
- [ ] Status da Evolution API
- [ ] Status do Supabase
- [ ] Status do n8n (se centralizado)
- [ ] Total de mensagens enviadas (últimas 24h)
- [ ] Total de agendamentos criados (últimas 24h)
- [ ] Storage usado / disponível
- [ ] Database size

#### Logs e Auditoria
- [ ] Logs de criação de tenants
- [ ] Logs de mudança de plano
- [ ] Logs de cancelamentos
- [ ] Logs de webhooks (Stripe, Evolution)
- [ ] Erros críticos

---

### 2. **Sistema de Billing (Stripe Integration)** ⚠️ CRÍTICO

**O que precisa:**

#### Planos
- [ ] Definir estrutura de planos:
  - **Básico:** R$ 97/mês - CRM + WhatsApp (1 número) + até 500 mensagens/mês
  - **Pro:** R$ 197/mês - + n8n + IA + até 2.000 mensagens/mês
  - **Enterprise:** R$ 397/mês - + white label avançado + ilimitado

- [ ] Configurar no Stripe:
  - Produtos
  - Preços (monthly/yearly)
  - Metadata (features, limits)

#### Checkout
- [ ] Página de pricing pública
- [ ] Integração Stripe Checkout
- [ ] Redirect após pagamento
- [ ] Trial de 7 dias (opcional)

#### Customer Portal
- [ ] Integração Stripe Customer Portal
- [ ] Cliente pode:
  - Ver faturas
  - Baixar recibos
  - Atualizar método de pagamento
  - Cancelar assinatura
  - Fazer upgrade/downgrade

#### Webhooks Stripe
- [ ] Endpoint `/api/webhooks/stripe`
- [ ] Eventos tratados:
  - `checkout.session.completed` → Ativar tenant
  - `invoice.paid` → Renovar assinatura
  - `invoice.payment_failed` → Suspender tenant
  - `customer.subscription.updated` → Atualizar plano
  - `customer.subscription.deleted` → Cancelar tenant

#### Banco de Dados
- [ ] Tabela `subscriptions`:
  ```sql
  id, unit_id, stripe_customer_id, stripe_subscription_id,
  plan, status, current_period_start, current_period_end,
  cancel_at_period_end, created_at, updated_at
  ```

- [ ] Tabela `invoices`:
  ```sql
  id, subscription_id, stripe_invoice_id, amount, status,
  paid_at, invoice_pdf, created_at
  ```

- [ ] Tabela `usage_limits`:
  ```sql
  id, unit_id, plan, messages_sent, clients_count, storage_used,
  reset_at, created_at
  ```

#### Enforcement de Limites
- [ ] Verificar mensagens enviadas vs limite do plano
- [ ] Bloquear envio se exceder (ou cobrar adicional)
- [ ] Alert quando atingir 80% do limite
- [ ] Upgrade automático sugerido

---

### 3. **Signup Automático** ⚠️ ALTA PRIORIDADE

**O que precisa:**

#### Página de Signup Público
- [ ] Rota: `/signup` (não protegida)
- [ ] Campos:
  - Nome completo
  - Email
  - Senha (validação forte)
  - Nome da empresa
  - Telefone
  - Aceite de termos

#### Processo Automático
Ao clicar "Criar Conta":

1. **Criar usuário no Supabase Auth:**
   ```typescript
   const { data: { user }, error } = await supabase.auth.signUp({
     email,
     password
   })
   ```

2. **Criar unit:**
   ```sql
   INSERT INTO units (name, slug, whatsapp_instance_name)
   VALUES (
     'Nome da Empresa',
     generate_slug('Nome da Empresa'),
     generate_instance_name('Nome da Empresa')
   )
   RETURNING id;
   ```

3. **Criar profile:**
   ```sql
   INSERT INTO profiles (id, unit_id, name, role)
   VALUES (user_id, unit_id, 'Admin', 'admin');
   ```

4. **Criar assinatura trial (se Stripe configurado):**
   ```typescript
   const session = await stripe.checkout.sessions.create({
     customer_email: email,
     mode: 'subscription',
     line_items: [{ price: 'price_basic', quantity: 1 }],
     trial_period_days: 7
   })
   ```

5. **Redirecionar para onboarding:**
   - `/onboarding/welcome`
   - `/onboarding/configure-whatsapp`
   - `/onboarding/personalize`
   - `/onboarding/install-automation`
   - `/dashboard`

#### Email de Boas-Vindas
- [ ] Trigger Supabase Edge Function
- [ ] Email com:
  - Link de confirmação (se necessário)
  - Credenciais de acesso
  - Tutorial de primeiros passos
  - Link para suporte

---

### 4. **Onboarding Guiado** 📋 MÉDIA PRIORIDADE

**Wizard em 4 passos:**

#### Step 1: Bem-vindo
- [ ] Vídeo de introdução (1 min)
- [ ] "Vamos configurar seu CRM em 5 minutos!"

#### Step 2: Conectar WhatsApp
- [ ] Gerar QR Code
- [ ] Instruções visuais
- [ ] Validação: "WhatsApp conectado ✅"

#### Step 3: Personalizar Visual
- [ ] Upload de logo
- [ ] Escolher paleta de cores (presets)
- [ ] Preview em tempo real
- [ ] "Salvar e Continuar"

#### Step 4: Instalar Automação
- [ ] Explicação sobre n8n
- [ ] 3 workflows com toggle on/off
- [ ] "Pular por enquanto" ou "Instalar"

#### Step 5: Pronto!
- [ ] "Seu CRM está pronto! 🎉"
- [ ] Botão: "Ir para Dashboard"
- [ ] Checklist de próximos passos:
  - [ ] Cadastrar primeiro cliente
  - [ ] Criar primeiro agendamento
  - [ ] Enviar primeira mensagem

---

### 5. **Analytics Avançado (para Tenants)** 📊 BAIXA PRIORIDADE

**Dashboard melhorado:**

- [ ] Gráfico de clientes novos (últimos 30 dias)
- [ ] Gráfico de agendamentos (por dia da semana)
- [ ] Taxa de ocupação (horários mais agendados)
- [ ] Receita por serviço
- [ ] Receita por profissional
- [ ] Top 10 clientes (por ticket médio)
- [ ] Taxa de retenção (clientes que voltam)
- [ ] NPS (Net Promoter Score) - opcional

---

### 6. **Melhorias UX** 🎨 BAIXA PRIORIDADE

- [ ] Dark mode
- [ ] Atalhos de teclado
- [ ] Tour guiado (tooltips interativos)
- [ ] Notificações push (navegador)
- [ ] PWA (Progressive Web App)
- [ ] Modo offline (service worker)

---

### 7. **Integrações Adicionais** 🔌 FUTURO

- [ ] Google Calendar (sincronizar agendamentos)
- [ ] Calendly (agendamento externo)
- [ ] PagSeguro / Mercado Pago (pagamentos no Brasil)
- [ ] Instagram Direct (mensageria)
- [ ] Email marketing (Mailchimp, SendGrid)
- [ ] Zapier (connect anything)

---

### 8. **Mobile App** 📱 FUTURO (Opcional)

- [ ] React Native
- [ ] Funcionalidades:
  - Ver agendamentos do dia
  - Responder mensagens WhatsApp
  - Cadastrar cliente rápido
  - Notificações push nativas

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS COMPLETA

### Tabelas Existentes (Implementadas)

#### `units` (Tenants)
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  whatsapp_instance_name VARCHAR(255) UNIQUE,
  whatsapp_connected BOOLEAN DEFAULT false,

  -- Personalização
  logo_url TEXT,
  brand_name VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#8B5CF6',
  secondary_color VARCHAR(7) DEFAULT '#6B7280',
  accent_color VARCHAR(7) DEFAULT '#EC4899',
  sidebar_bg_color VARCHAR(7) DEFAULT '#FFFFFF',
  custom_css TEXT,

  -- n8n
  n8n_url TEXT,
  n8n_api_key TEXT,
  gemini_api_key TEXT,

  -- IA
  pausa_ia BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_units_slug ON units(slug);
CREATE INDEX idx_units_instance_name ON units(whatsapp_instance_name);
```

#### `profiles` (Usuários)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user', 'professional'
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_unit_id ON profiles(unit_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage data from their unit"
ON profiles FOR ALL
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

#### `clients` (Clientes)
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  cpf VARCHAR(14),
  address TEXT,
  notes TEXT,
  tags TEXT[],
  welcome_sent_at TIMESTAMP,
  last_contact TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clients_unit_id ON clients(unit_id);
CREATE INDEX idx_clients_phone ON clients(phone);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage data from their unit"
ON clients FOR ALL
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

#### `services` (Serviços)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  duration INTEGER, -- em minutos
  category VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_services_unit_id ON services(unit_id);

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage data from their unit"
ON services FOR ALL
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

#### `appointments` (Agendamentos)
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,

  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'pending_confirmation', 'confirmed', 'cancelled', 'completed'

  notes TEXT,
  confirmation_sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointments_unit_id ON appointments(unit_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage data from their unit"
ON appointments FOR ALL
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

#### `whatsapp_instances` (Instâncias WhatsApp)
```sql
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'disconnected', -- 'connecting', 'connected', 'disconnected'
  phone_number VARCHAR(20),
  connected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_instances_unit_id ON whatsapp_instances(unit_id);
CREATE INDEX idx_whatsapp_instances_instance_name ON whatsapp_instances(instance_name);

-- RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage data from their unit"
ON whatsapp_instances FOR ALL
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

#### `conversations` (Mensagens)
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  sender VARCHAR(50) NOT NULL, -- 'client', 'agent', 'system'
  message TEXT NOT NULL,
  media_url TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_unit_id ON conversations(unit_id);
CREATE INDEX idx_conversations_phone ON conversations(phone);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp DESC);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage data from their unit"
ON conversations FOR ALL
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

---

### Tabelas Necessárias (Missing - Para Super Admin)

#### `subscriptions` (Assinaturas)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,

  -- Stripe
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,

  -- Plano
  plan VARCHAR(50) NOT NULL, -- 'basic', 'pro', 'enterprise'
  status VARCHAR(50) NOT NULL, -- 'trialing', 'active', 'past_due', 'canceled', 'unpaid'

  -- Períodos
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,

  -- Cancelamento
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_unit_id ON subscriptions(unit_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS: Super admin only
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all subscriptions"
ON subscriptions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Units view their own subscription"
ON subscriptions FOR SELECT
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

#### `invoices` (Faturas)
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Stripe
  stripe_invoice_id VARCHAR(255) UNIQUE,

  -- Dados
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'

  -- Datas
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  paid_at TIMESTAMP,
  due_date TIMESTAMP,

  -- URLs
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all invoices"
ON invoices FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Units view their own invoices"
ON invoices FOR SELECT
TO authenticated
USING (
  subscription_id IN (
    SELECT id FROM subscriptions
    WHERE unit_id IN (
      SELECT unit_id FROM profiles WHERE id = auth.uid()
    )
  )
);
```

#### `usage_metrics` (Métricas de Uso)
```sql
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,

  -- Período
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Uso
  messages_sent INTEGER DEFAULT 0,
  clients_count INTEGER DEFAULT 0,
  appointments_count INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,

  -- Limites do plano
  plan VARCHAR(50),
  messages_limit INTEGER,
  clients_limit INTEGER,
  storage_limit_mb INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_metrics_unit_id ON usage_metrics(unit_id);
CREATE INDEX idx_usage_metrics_period ON usage_metrics(period_start, period_end);

-- RLS
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view all metrics"
ON usage_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Units view their own metrics"
ON usage_metrics FOR SELECT
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

#### `audit_logs` (Logs de Auditoria)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Evento
  action VARCHAR(100) NOT NULL, -- 'unit.created', 'unit.suspended', 'plan.upgraded', etc.
  resource_type VARCHAR(50), -- 'unit', 'subscription', 'client', etc.
  resource_id UUID,

  -- Detalhes
  details JSONB,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_unit_id ON audit_logs(unit_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS: Super admin only
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view all logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

#### `feature_flags` (Flags de Features)
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,

  -- Feature
  feature_key VARCHAR(100) NOT NULL, -- 'gemini_chatbot', 'advanced_analytics', etc.
  enabled BOOLEAN DEFAULT false,

  -- Metadata
  config JSONB, -- Configurações específicas da feature

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(unit_id, feature_key)
);

CREATE INDEX idx_feature_flags_unit_id ON feature_flags(unit_id);
CREATE INDEX idx_feature_flags_feature_key ON feature_flags(feature_key);

-- RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all flags"
ON feature_flags FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Units view their own flags"
ON feature_flags FOR SELECT
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles WHERE id = auth.uid()
));
```

---

### Atualização da Tabela `profiles` (Adicionar Super Admin)

```sql
-- Alterar ENUM de role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('super_admin', 'admin', 'user', 'professional'));

-- Criar super admin (contato@aion3.com.br)
-- Primeiro, criar usuário no Supabase Auth Dashboard
-- Depois, executar:

INSERT INTO profiles (id, unit_id, name, role)
VALUES (
  'uuid-do-usuario-criado-no-auth', -- Substituir pelo ID real
  NULL, -- Super admin não pertence a nenhuma unit
  'Super Admin',
  'super_admin'
);

-- Policy para super admin ver tudo
CREATE POLICY "Super admins view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

---

## 🎛️ DASHBOARD SUPER ADMIN - REQUISITOS COMPLETOS

### Rota: `/super-admin`

**Proteção:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.redirect('/dashboard')
  }

  return NextResponse.next()
}
```

---

### 1. **Overview (Visão Geral)**

**Métricas Principais (Cards):**

```typescript
// Total de Tenants
SELECT COUNT(*) FROM units;

// Tenants Ativos (com assinatura ativa)
SELECT COUNT(*) FROM subscriptions WHERE status = 'active';

// MRR (Monthly Recurring Revenue)
SELECT SUM(
  CASE
    WHEN plan = 'basic' THEN 97
    WHEN plan = 'pro' THEN 197
    WHEN plan = 'enterprise' THEN 397
  END
) FROM subscriptions WHERE status IN ('active', 'trialing');

// Novos Tenants (Este Mês)
SELECT COUNT(*) FROM units
WHERE created_at >= date_trunc('month', NOW());

// Churn Rate (Últimos 30 dias)
WITH canceled AS (
  SELECT COUNT(*) as cnt FROM subscriptions
  WHERE canceled_at >= NOW() - INTERVAL '30 days'
),
total AS (
  SELECT COUNT(*) as cnt FROM subscriptions
  WHERE status = 'active'
)
SELECT (canceled.cnt::FLOAT / total.cnt::FLOAT) * 100 as churn_rate
FROM canceled, total;
```

**Gráficos:**

1. **Crescimento de Tenants (Últimos 6 Meses)**
   - Eixo X: Mês
   - Eixo Y: Total de tenants
   - Linha: Tenants ativos acumulados

2. **Receita Mensal (MRR - Últimos 6 Meses)**
   - Eixo X: Mês
   - Eixo Y: MRR (R$)
   - Barras: Receita por mês

3. **Distribuição por Plano (Pie Chart)**
   - Básico: X%
   - Pro: Y%
   - Enterprise: Z%

---

### 2. **Gestão de Tenants**

**Tabela com:**

| Logo | Nome | Email | Plano | Status | Criado | Último Acesso | Ações |
|------|------|-------|-------|--------|--------|---------------|-------|
| 🖼️ | Beto Style | styleb251@gmail.com | Pro | ✅ Ativo | 01/12/25 | 2h atrás | 👁️ 🔧 ⏸️ 🗑️ |

**Filtros:**
- Buscar por nome, email, slug
- Filtro por plano (Básico, Pro, Enterprise)
- Filtro por status (Ativo, Trial, Suspenso, Cancelado)
- Ordenar por: Data de criação, Nome, MRR

**Ações:**

1. **👁️ Ver Detalhes:** Modal com informações completas
   - Dados da unit
   - Assinatura atual
   - Uso de recursos
   - Histórico de faturas
   - Logs recentes

2. **🔧 Editar:**
   - Alterar plano manualmente
   - Aplicar desconto
   - Definir limites customizados
   - Ativar/desativar features específicas

3. **🧑‍💼 Impersonation (Fazer Login Como):**
   ```typescript
   async function impersonate(unitId: string) {
     // Gerar token temporário
     const { data: profile } = await supabase
       .from('profiles')
       .select('id')
       .eq('unit_id', unitId)
       .eq('role', 'admin')
       .single()

     // Criar sessão temporária
     const { data: session } = await supabase.auth.admin.createSession({
       userId: profile.id,
       expiresIn: 3600 // 1 hora
     })

     // Redirecionar para dashboard do tenant com sessão temporária
     window.open(`/dashboard?impersonate=${session.access_token}`, '_blank')
   }
   ```

4. **⏸️ Suspender:**
   - Atualiza `subscriptions.status = 'suspended'`
   - Desconecta WhatsApp
   - Bloqueia acesso ao dashboard
   - Envia email de notificação

5. **🗑️ Deletar:**
   - Soft delete (marca como deletado, não remove)
   - Mantém dados por 30 dias (compliance)
   - Opção de hard delete após 30 dias

---

### 3. **Gestão de Assinaturas**

**Filtros:**
- Status: Todos, Ativo, Trial, Vencido, Cancelado
- Plano: Todos, Básico, Pro, Enterprise

**Tabela:**

| Tenant | Plano | Status | Próxima Cobrança | Valor | Ações |
|--------|-------|--------|------------------|-------|-------|
| Beto Style | Pro | ✅ Ativo | 01/01/26 | R$ 197 | 🔄 📄 ❌ |

**Ações:**

1. **🔄 Alterar Plano:**
   - Upgrade (prorrateado)
   - Downgrade (aplicado no próximo ciclo)
   - Aplicar cupom de desconto

2. **📄 Ver Faturas:**
   - Histórico completo
   - Download de PDF
   - Reenviar fatura

3. **❌ Cancelar:**
   - Cancelamento imediato
   - Cancelamento ao fim do período
   - Motivo do cancelamento (pesquisa)

---

### 4. **Analytics e Métricas**

#### Métricas de Negócio:

1. **LTV (Lifetime Value):**
   ```sql
   SELECT AVG(total_paid) FROM (
     SELECT subscription_id, SUM(amount) as total_paid
     FROM invoices
     WHERE status = 'paid'
     GROUP BY subscription_id
   ) as totals;
   ```

2. **CAC (Customer Acquisition Cost):**
   - Informado manualmente (gastos com marketing / novos clientes)

3. **Payback Period:**
   - CAC / MRR médio por cliente

#### Métricas de Uso:

**Tabela de Top Tenants:**

| Tenant | Clientes | Mensagens/mês | Storage | Plano | Ações |
|--------|----------|---------------|---------|-------|-------|
| Clínica Bella | 320 | 1.850 | 150 MB | Pro | Sugerir Enterprise |

**Alertas:**
- 🟠 Tenant próximo do limite (80% do plano)
- 🔴 Tenant excedeu limite (sugerir upgrade)

---

### 5. **System Health**

**Status dos Serviços:**

```typescript
// Verificar Evolution API
async function checkEvolutionAPI() {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_API_KEY }
    })
    return response.ok ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}

// Verificar Supabase
async function checkSupabase() {
  try {
    const { error } = await supabase.from('units').select('count').single()
    return !error ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}
```

**Métricas Operacionais:**

- Total de mensagens enviadas (últimas 24h)
- Total de agendamentos criados (últimas 24h)
- Storage total usado
- Database size
- API errors (últimas 24h)

**Logs em Tempo Real:**
- Stream de eventos importantes:
  - ✅ Novo tenant criado: Clínica Bella
  - 💳 Pagamento recebido: R$ 197 - Beto Style
  - ⚠️ Pagamento falhou: Salon XYZ
  - ❌ Tenant cancelado: Podologia ABC

---

### 6. **Logs e Auditoria**

**Filtros:**
- Tipo de evento
- Tenant específico
- Range de datas
- Usuário

**Eventos Logados:**

```typescript
type AuditAction =
  | 'unit.created'
  | 'unit.suspended'
  | 'unit.reactivated'
  | 'unit.deleted'
  | 'subscription.created'
  | 'subscription.upgraded'
  | 'subscription.downgraded'
  | 'subscription.canceled'
  | 'invoice.paid'
  | 'invoice.failed'
  | 'impersonation.started'
  | 'impersonation.ended'
  | 'feature_flag.toggled'

// Exemplo de log
await supabase.from('audit_logs').insert({
  unit_id: unitId,
  user_id: auth.user().id,
  action: 'subscription.upgraded',
  resource_type: 'subscription',
  resource_id: subscriptionId,
  details: {
    from_plan: 'basic',
    to_plan: 'pro',
    prorated_amount: 100
  },
  ip_address: request.ip,
  user_agent: request.headers['user-agent']
})
```

**Tabela de Logs:**

| Data/Hora | Tenant | Usuário | Ação | Detalhes |
|-----------|--------|---------|------|----------|
| 03/12 14:35 | Beto Style | Super Admin | subscription.upgraded | Básico → Pro (R$ 100 prorrateado) |

---

### 7. **Configurações Globais**

#### Planos e Preços:
- [ ] Editar valores dos planos
- [ ] Criar novos planos
- [ ] Definir limites (mensagens, clientes, storage)
- [ ] Ativar/desativar planos

#### Feature Flags Globais:
- [ ] Habilitar Gemini Chatbot (beta)
- [ ] Habilitar Analytics Avançado
- [ ] Habilitar Integrações (Google Calendar, etc.)

#### Email Templates:
- [ ] Email de boas-vindas
- [ ] Email de renovação de assinatura
- [ ] Email de pagamento falhou
- [ ] Email de cancelamento

#### Webhooks:
- [ ] Configurar URL para eventos (opcional)
- [ ] Logs de webhooks enviados

---

## 💳 STRIPE INTEGRATION - ARQUITETURA COMPLETA

### 1. **Setup Inicial no Stripe**

#### Criar Produtos e Preços:

**Produto: Básico**
```javascript
const basicProduct = await stripe.products.create({
  name: 'Plano Básico',
  description: 'CRM + WhatsApp',
  metadata: {
    features: JSON.stringify([
      'CRM Completo',
      'WhatsApp (1 número)',
      'Até 500 mensagens/mês',
      'Até 100 clientes'
    ]),
    messages_limit: 500,
    clients_limit: 100,
    storage_limit_mb: 500
  }
})

const basicPrice = await stripe.prices.create({
  product: basicProduct.id,
  unit_amount: 9700, // R$ 97,00
  currency: 'brl',
  recurring: { interval: 'month' },
  metadata: { plan_key: 'basic' }
})
```

**Produto: Pro**
```javascript
const proProduct = await stripe.products.create({
  name: 'Plano Pro',
  description: 'CRM + WhatsApp + Automação + IA',
  metadata: {
    features: JSON.stringify([
      'Tudo do Básico',
      'n8n Workflows',
      'IA Generativa (Gemini)',
      'Até 2.000 mensagens/mês',
      'Até 500 clientes'
    ]),
    messages_limit: 2000,
    clients_limit: 500,
    storage_limit_mb: 2000
  }
})

const proPrice = await stripe.prices.create({
  product: proProduct.id,
  unit_amount: 19700, // R$ 197,00
  currency: 'brl',
  recurring: { interval: 'month' },
  metadata: { plan_key: 'pro' }
})
```

**Produto: Enterprise**
```javascript
const enterpriseProduct = await stripe.products.create({
  name: 'Plano Enterprise',
  description: 'White Label Avançado + Ilimitado',
  metadata: {
    features: JSON.stringify([
      'Tudo do Pro',
      'White Label Completo',
      'Mensagens ilimitadas',
      'Clientes ilimitados',
      'Suporte prioritário',
      'Custom domain'
    ]),
    messages_limit: -1, // -1 = ilimitado
    clients_limit: -1,
    storage_limit_mb: 10000
  }
})

const enterprisePrice = await stripe.prices.create({
  product: enterpriseProduct.id,
  unit_amount: 39700, // R$ 397,00
  currency: 'brl',
  recurring: { interval: 'month' },
  metadata: { plan_key: 'enterprise' }
})
```

---

### 2. **Fluxo de Signup com Stripe**

#### Página `/pricing` (Pública)

```typescript
export default function PricingPage() {
  const plans = [
    {
      name: 'Básico',
      price: 'R$ 97',
      priceId: 'price_xxxxx', // Stripe Price ID
      features: [
        'CRM Completo',
        'WhatsApp (1 número)',
        'Até 500 mensagens/mês',
        'Até 100 clientes'
      ]
    },
    {
      name: 'Pro',
      price: 'R$ 197',
      priceId: 'price_yyyyy',
      features: [
        'Tudo do Básico',
        'n8n Workflows',
        'IA Generativa (Gemini)',
        'Até 2.000 mensagens/mês',
        'Até 500 clientes'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'R$ 397',
      priceId: 'price_zzzzz',
      features: [
        'Tudo do Pro',
        'White Label Completo',
        'Ilimitado',
        'Suporte prioritário'
      ]
    }
  ]

  const handleSelectPlan = async (priceId: string) => {
    // Redirecionar para signup com plano selecionado
    router.push(`/signup?plan=${priceId}`)
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      {plans.map(plan => (
        <PlanCard key={plan.name} plan={plan} onSelect={handleSelectPlan} />
      ))}
    </div>
  )
}
```

#### Página `/signup`

```typescript
export default function SignupPage() {
  const searchParams = useSearchParams()
  const selectedPriceId = searchParams.get('plan')

  const handleSignup = async (formData: SignupForm) => {
    // 1. Criar usuário no Supabase Auth
    const { data: { user }, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    })

    if (error) throw error

    // 2. Criar unit
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .insert({
        name: formData.company_name,
        slug: generateSlug(formData.company_name),
        whatsapp_instance_name: `crm-${generateSlug(formData.company_name)}`
      })
      .select()
      .single()

    if (unitError) throw unitError

    // 3. Criar profile
    await supabase.from('profiles').insert({
      id: user.id,
      unit_id: unit.id,
      name: formData.name,
      role: 'admin'
    })

    // 4. Criar Checkout Session no Stripe
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: selectedPriceId,
        unitId: unit.id,
        email: formData.email
      })
    })

    const { sessionUrl } = await response.json()

    // 5. Redirecionar para Stripe Checkout
    window.location.href = sessionUrl
  }

  return <SignupForm onSubmit={handleSignup} />
}
```

#### API Route: `/api/stripe/create-checkout`

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { priceId, unitId, email } = await request.json()

  // Criar Customer no Stripe
  const customer = await stripe.customers.create({
    email,
    metadata: { unit_id: unitId }
  })

  // Criar Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    subscription_data: {
      trial_period_days: 7, // 7 dias grátis
      metadata: { unit_id: unitId }
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/signup?canceled=true`,
    metadata: { unit_id: unitId }
  })

  return Response.json({ sessionUrl: session.url })
}
```

---

### 3. **Webhooks Stripe**

#### Endpoint: `/api/webhooks/stripe`

```typescript
import { buffer } from 'micro'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const config = {
  api: { bodyParser: false }
}

export async function POST(request: Request) {
  const buf = await buffer(request)
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err: any) {
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Processar eventos
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_failed':
      await handleInvoiceFailed(event.data.object as Stripe.Invoice)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return Response.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const unitId = session.metadata?.unit_id

  if (!unitId) return

  // Buscar subscription criada
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  const plan = subscription.items.data[0].price.metadata.plan_key

  // Criar registro de assinatura no banco
  await supabase.from('subscriptions').insert({
    unit_id: unitId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscription.id,
    plan,
    status: subscription.status,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000)
  })

  // Log de auditoria
  await supabase.from('audit_logs').insert({
    unit_id: unitId,
    action: 'subscription.created',
    resource_type: 'subscription',
    resource_id: subscription.id,
    details: { plan, status: subscription.status }
  })

  // Enviar email de boas-vindas
  // await sendWelcomeEmail(...)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  // Buscar assinatura no banco
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!subscription) return

  // Atualizar status
  await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('id', subscription.id)

  // Salvar fatura
  await supabase.from('invoices').insert({
    subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_paid / 100, // Stripe usa centavos
    currency: invoice.currency,
    status: 'paid',
    period_start: new Date(invoice.period_start * 1000),
    period_end: new Date(invoice.period_end * 1000),
    paid_at: new Date(invoice.status_transitions.paid_at! * 1000),
    invoice_pdf: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url
  })

  // Log
  await supabase.from('audit_logs').insert({
    unit_id: subscription.unit_id,
    action: 'invoice.paid',
    resource_type: 'invoice',
    resource_id: invoice.id,
    details: { amount: invoice.amount_paid / 100 }
  })
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!subscription) return

  // Atualizar status para past_due
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('id', subscription.id)

  // Suspender tenant após 3 falhas
  const failedInvoicesCount = await stripe.invoices.list({
    subscription: subscriptionId,
    status: 'uncollectible',
    limit: 10
  })

  if (failedInvoicesCount.data.length >= 3) {
    // Suspender
    await supabase
      .from('subscriptions')
      .update({ status: 'suspended' })
      .eq('id', subscription.id)

    // Desconectar WhatsApp
    await supabase
      .from('whatsapp_instances')
      .update({ status: 'disconnected' })
      .eq('unit_id', subscription.unit_id)

    // Enviar email de suspensão
    // await sendSuspensionEmail(...)
  }

  // Log
  await supabase.from('audit_logs').insert({
    unit_id: subscription.unit_id,
    action: 'invoice.failed',
    resource_type: 'invoice',
    resource_id: invoice.id,
    details: { attempt: invoice.attempt_count }
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!sub) return

  const newPlan = subscription.items.data[0].price.metadata.plan_key

  // Atualizar assinatura
  await supabase
    .from('subscriptions')
    .update({
      plan: newPlan,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('id', sub.id)

  // Log
  await supabase.from('audit_logs').insert({
    unit_id: sub.unit_id,
    action: 'subscription.updated',
    resource_type: 'subscription',
    resource_id: subscription.id,
    details: {
      old_plan: sub.plan,
      new_plan: newPlan,
      status: subscription.status
    }
  })
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!sub) return

  // Atualizar status
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date()
    })
    .eq('id', sub.id)

  // Suspender tenant
  await supabase
    .from('whatsapp_instances')
    .update({ status: 'disconnected' })
    .eq('unit_id', sub.unit_id)

  // Log
  await supabase.from('audit_logs').insert({
    unit_id: sub.unit_id,
    action: 'subscription.canceled',
    resource_type: 'subscription',
    resource_id: subscription.id
  })

  // Enviar email de cancelamento
  // await sendCancellationEmail(...)
}
```

---

### 4. **Customer Portal (Área do Cliente)**

#### Página: `/configuracoes/assinatura`

```typescript
export default function SubscriptionPage() {
  const { profile } = useAuth()
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    async function loadSubscription() {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('unit_id', profile.unit_id)
        .single()

      setSubscription(data)
    }
    loadSubscription()
  }, [])

  const handleManageSubscription = async () => {
    // Criar Customer Portal Session
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: subscription.stripe_customer_id,
        returnUrl: window.location.href
      })
    })

    const { url } = await response.json()
    window.location.href = url
  }

  return (
    <div>
      <h1>Minha Assinatura</h1>

      <Card>
        <p>Plano Atual: <strong>{subscription?.plan.toUpperCase()}</strong></p>
        <p>Status: <Badge>{subscription?.status}</Badge></p>
        <p>Próxima Cobrança: {formatDate(subscription?.current_period_end)}</p>

        <Button onClick={handleManageSubscription}>
          Gerenciar Assinatura
        </Button>
      </Card>

      <Card>
        <h3>Histórico de Faturas</h3>
        <InvoicesTable subscriptionId={subscription?.id} />
      </Card>
    </div>
  )
}
```

#### API Route: `/api/stripe/create-portal-session`

```typescript
export async function POST(request: Request) {
  const { customerId, returnUrl } = await request.json()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  })

  return Response.json({ url: session.url })
}
```

**No Customer Portal, cliente pode:**
- Ver faturas e baixar PDFs
- Atualizar método de pagamento
- Fazer upgrade/downgrade de plano
- Cancelar assinatura

---

### 5. **Enforcement de Limites**

#### Middleware para Verificar Limites

```typescript
// lib/services/usageLimits.ts

export async function checkMessageLimit(unitId: string): Promise<boolean> {
  // Buscar assinatura
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('unit_id', unitId)
    .single()

  if (!subscription) return false

  // Buscar limite do plano
  const limits = {
    basic: 500,
    pro: 2000,
    enterprise: -1 // ilimitado
  }

  const limit = limits[subscription.plan as keyof typeof limits]

  if (limit === -1) return true // ilimitado

  // Contar mensagens enviadas este mês
  const { count } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('unit_id', unitId)
    .eq('sender', 'agent')
    .gte('timestamp', startOfMonth(new Date()))

  return (count || 0) < limit
}

export async function trackMessageSent(unitId: string) {
  // Incrementar contador (para métricas)
  await supabase.rpc('increment_messages_sent', { p_unit_id: unitId })
}
```

#### Usar no Envio de Mensagem

```typescript
// app/api/whatsapp/send/route.ts

export async function POST(request: Request) {
  const { unitId, phone, message } = await request.json()

  // Verificar limite
  const canSend = await checkMessageLimit(unitId)

  if (!canSend) {
    return Response.json({
      error: 'Limite de mensagens atingido. Faça upgrade do seu plano.'
    }, { status: 403 })
  }

  // Enviar mensagem
  await EvolutionAPI.sendTextMessage({ number: phone, text: message }, instanceName)

  // Rastrear uso
  await trackMessageSent(unitId)

  return Response.json({ success: true })
}
```

---

## 🎯 DOR DE MERCADO E DIFERENCIAIS

### Dor de Mercado (Pain Points)

**1. Salões, Clínicas e Podologias sofrem com:**

#### Gestão Caótica de Clientes
- 📱 Clientes agendados via WhatsApp pessoal
- 📒 Cadernos de papel
- 📊 Planilhas desorganizadas no Excel
- ❌ Sem histórico centralizado
- ❌ Perdem clientes por falta de follow-up

#### Agendamentos Conflitantes
- 📅 Double booking frequente
- ⏰ Esquecimento de horários
- 📞 Confirmações manuais demoradas
- ❌ No-shows (clientes que não aparecem)

#### Comunicação Ineficiente
- 💬 Responder cada mensagem manualmente
- 🕐 Disponibilidade 24/7 impossível
- ❌ Mensagens importantes perdidas
- ❌ Dificuldade em fazer campanhas

#### Falta de Automação
- 🤖 Tudo manual e repetitivo
- ⏱️ Tempo desperdiçado em tarefas burocráticas
- ❌ Sem boas-vindas automáticas
- ❌ Sem lembretes de agendamento

#### Custos Altos com Múltiplas Ferramentas
- 💰 R$ 99 pro CRM
- 💰 R$ 79 pro agendamento online
- 💰 R$ 149 pro WhatsApp Business API
- 💰 R$ 197 pra automação
- 💰 **Total: R$ 524/mês** em ferramentas separadas

#### Ferramentas Complicadas
- 🧩 Difícil integrar sistemas diferentes
- 📚 Curva de aprendizado alta
- 👨‍💻 Precisa de técnico pra configurar
- ❌ Suporte ruim ou inexistente

---

### Seus Diferenciais (Por Que Escolher Você)

#### 1. **Tudo-em-Um (All-in-One)**
**Problema resolvido:** Múltiplas ferramentas caras

✅ CRM completo
✅ Agendamento online
✅ WhatsApp integrado
✅ Automação com IA
✅ Relatórios financeiros
✅ Gestão de estoque

**Resultado:** 1 plataforma = R$ 197/mês (vs R$ 524/mês em ferramentas separadas)

---

#### 2. **Plug-and-Play (Zero Fricção)**
**Problema resolvido:** Ferramentas complicadas que exigem técnico

✅ Signup em 2 minutos
✅ WhatsApp conecta escaneando QR Code
✅ Workflows n8n instalam com 1 clique
✅ Onboarding guiado passo a passo
✅ Interface intuitiva (sem treinamento necessário)

**Resultado:** Cliente operando em 10 minutos após cadastro

---

#### 3. **White Label Completo**
**Problema resolvido:** Software genérico sem identidade da marca

✅ Upload de logo próprio
✅ Cores personalizadas
✅ Nome da marca em toda interface
✅ Cliente nem sabe que é white label

**Resultado:** Software parece feito especialmente para a clínica

---

#### 4. **Automação com IA Generativa**
**Problema resolvido:** Atendimento manual 24/7 impossível

✅ Google Gemini responde automaticamente
✅ Contexto da conversa mantido
✅ Respostas humanizadas
✅ Aprendizado contínuo
✅ Pausa manual quando necessário

**Resultado:** 80% das mensagens respondidas automaticamente

---

#### 5. **WhatsApp Business Integrado (Sem Complicação)**
**Problema resolvido:** WhatsApp Business API é caro e complexo

✅ 1 instância exclusiva por cliente
✅ Sem conflitos entre clientes
✅ Sem precisar contratar Evolution separadamente
✅ Tudo gerenciado pela plataforma

**Resultado:** WhatsApp profissional sem custos adicionais

---

#### 6. **Workflows Pré-Construídos (n8n)**
**Problema resolvido:** Automação requer programação

✅ 3 workflows prontos
✅ Instalação com 1 clique
✅ Funcionando instantaneamente
✅ Sem código

**Workflows:**
- Recepção automática de mensagens (IA)
- Confirmação de agendamentos
- Boas-vindas para novos clientes

**Resultado:** Automação completa sem saber programar

---

#### 7. **Preço Justo para PMEs Brasileiras**
**Problema resolvido:** Ferramentas internacionais em dólar

✅ Preços em reais
✅ Voltado para pequenos negócios
✅ Trial de 7 dias grátis
✅ Sem taxas escondidas

**Planos:**
- Básico: R$ 97/mês
- Pro: R$ 197/mês
- Enterprise: R$ 397/mês

**Resultado:** ROI em 1 mês (economiza tempo = economiza dinheiro)

---

#### 8. **Multi-Tenant Seguro (Isolamento Total)**
**Problema resolvido:** Dados vazando entre clientes

✅ RLS (Row Level Security)
✅ Instância WhatsApp única por cliente
✅ Impossível cliente A ver dados de cliente B
✅ Compliance com LGPD

**Resultado:** Confiança e segurança de dados

---

### Comparação com Concorrentes

| Recurso | Seu SaaS | Agendei | Clínica nas Nuvens | Nuvem Shop |
|---------|----------|---------|-------------------|------------|
| CRM | ✅ | ✅ | ✅ | ❌ |
| Agendamento Online | ✅ | ✅ | ✅ | ❌ |
| WhatsApp Integrado | ✅ | ❌ | ⚠️ (extra) | ❌ |
| IA Generativa | ✅ | ❌ | ❌ | ❌ |
| n8n Automação | ✅ | ❌ | ❌ | ❌ |
| White Label | ✅ | ⚠️ (caro) | ⚠️ (caro) | ✅ |
| Setup Plug-and-Play | ✅ | ❌ | ❌ | ❌ |
| Preço Médio | **R$ 197** | R$ 99 | R$ 149 | R$ 79 |
| **Valor Entregue** | 🏆 **Máximo** | Médio | Médio | Baixo |

---

### Elevator Pitch (30 segundos)

> "Sabe aquele salão ou clínica que perde clientes porque não consegue responder todas as mensagens no WhatsApp? E que tem agendamentos anotados em caderno, gerando conflitos?
>
> Nosso CRM resolve isso: **WhatsApp com IA respondendo automaticamente, agendamento online visual, e automação completa** - tudo em 1 plataforma white label por R$ 197/mês.
>
> Outras ferramentas cobram isso SÓ pelo WhatsApp Business API. Nós entregamos o pacote completo."

---

### Target Audience (Público-Alvo Ideal)

**1. Salões de Beleza**
- 👥 5-15 funcionários
- 📅 50-200 agendamentos/mês
- 💬 100-500 mensagens WhatsApp/mês
- 💰 Faturamento: R$ 20k-100k/mês

**2. Clínicas de Estética**
- 👥 3-10 profissionais
- 📅 80-300 agendamentos/mês
- 💬 150-800 mensagens WhatsApp/mês
- 💰 Faturamento: R$ 30k-150k/mês

**3. Podologias**
- 👥 1-5 profissionais
- 📅 30-150 agendamentos/mês
- 💬 80-300 mensagens WhatsApp/mês
- 💰 Faturamento: R$ 10k-50k/mês

**4. Barbearias**
- 👥 2-8 barbeiros
- 📅 100-400 agendamentos/mês
- 💬 200-1000 mensagens WhatsApp/mês
- 💰 Faturamento: R$ 15k-80k/mês

**Características comuns:**
- ❌ Não têm desenvolvedor interno
- ❌ Não querem ferramentas complexas
- ✅ Usam muito WhatsApp
- ✅ Querem economizar tempo
- ✅ Querem parecer profissionais

---

## 🏗️ ARQUITETURA DE USUÁRIOS (Roles)

### Estrutura de Permissões

```sql
-- Atualizar ENUM de roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('super_admin', 'admin', 'user', 'professional'));
```

### Roles e Permissões

#### 1. **Super Admin** (contato@aion3.com.br)
**Acesso:** Dashboard super admin + todos os tenants

**Permissões:**
- ✅ Ver todos os tenants
- ✅ Criar/editar/deletar tenants
- ✅ Ver/editar assinaturas
- ✅ Impersonation (fazer login como qualquer tenant)
- ✅ Ver analytics globais
- ✅ Gerenciar feature flags
- ✅ Ver logs de auditoria
- ✅ System health
- ❌ NÃO pertence a nenhuma unit (unit_id = NULL)

**RLS Policy:**
```sql
CREATE POLICY "Super admins view all"
ON units FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

---

#### 2. **Admin** (styleb251@gmail.com e futuros clientes)
**Acesso:** Dashboard do próprio tenant

**Permissões:**
- ✅ Ver/criar/editar/deletar clientes
- ✅ Ver/criar/editar/deletar agendamentos
- ✅ Ver/criar/editar/deletar serviços
- ✅ Ver/criar/editar/deletar produtos
- ✅ Configurar WhatsApp
- ✅ Configurar n8n
- ✅ Personalizar visual (logo, cores)
- ✅ Ver relatórios financeiros
- ✅ Gerenciar equipe (criar users, professionals)
- ✅ Ver/editar assinatura própria
- ❌ NÃO pode ver dados de outros tenants
- ❌ NÃO tem acesso ao super admin dashboard

**RLS Policy:**
```sql
CREATE POLICY "Admins manage their unit data"
ON clients FOR ALL
TO authenticated
USING (unit_id IN (
  SELECT unit_id FROM profiles
  WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
));
```

---

#### 3. **User** (Atendentes)
**Acesso:** Dashboard do tenant (limitado)

**Permissões:**
- ✅ Ver clientes
- ✅ Criar/editar clientes
- ✅ Ver agendamentos
- ✅ Criar agendamentos
- ✅ Responder mensagens WhatsApp
- ❌ NÃO pode deletar clientes
- ❌ NÃO pode editar serviços/produtos
- ❌ NÃO pode configurar WhatsApp
- ❌ NÃO pode personalizar visual
- ❌ NÃO pode ver relatórios financeiros

---

#### 4. **Professional** (Profissionais/Barbeiros/Cabeleireiros)
**Acesso:** Dashboard do tenant (muito limitado)

**Permissões:**
- ✅ Ver **apenas seus** agendamentos
- ✅ Ver clientes relacionados aos seus agendamentos
- ✅ Marcar agendamento como concluído
- ❌ NÃO pode criar/editar clientes
- ❌ NÃO pode ver agendamentos de outros profissionais
- ❌ NÃO pode configurar nada

**RLS Policy Específica:**
```sql
CREATE POLICY "Professionals view their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT unit_id FROM profiles WHERE id = auth.uid()
  ) AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'user')
    ) OR professional_id = auth.uid()
  )
);
```

---

### Setup dos Usuários Atuais

#### Super Admin: contato@aion3.com.br

```sql
-- 1. Criar usuário no Supabase Auth Dashboard:
-- Email: contato@aion3.com.br
-- Senha: [Definida por você]

-- 2. Criar profile (após criar no Auth):
INSERT INTO profiles (id, unit_id, name, role)
VALUES (
  'uuid-do-usuario-auth', -- Substituir pelo ID gerado no Auth
  NULL, -- Super admin não pertence a unit
  'Super Admin',
  'super_admin'
);

-- Verificar:
SELECT * FROM profiles WHERE role = 'super_admin';
```

---

#### Primeiro Cliente: styleb251@gmail.com (Beto Style)

```sql
-- 1. Verificar se unit existe:
SELECT id, name, slug FROM units WHERE name ILIKE '%beto%';

-- Se NÃO existir, criar:
INSERT INTO units (name, slug, whatsapp_instance_name)
VALUES (
  'Beto Style',
  'beto-style',
  'crm-beto-style'
)
RETURNING id;

-- 2. Verificar se usuário existe no Auth
SELECT id, email FROM auth.users WHERE email = 'styleb251@gmail.com';

-- 3. Se profile NÃO existe, criar:
INSERT INTO profiles (id, unit_id, name, role)
VALUES (
  'uuid-do-usuario-styleb251', -- ID do auth.users
  'uuid-da-unit-beto-style', -- ID da unit criada
  'Beto',
  'admin'
);

-- Verificar:
SELECT
  p.id,
  p.name,
  p.role,
  u.name as unit_name,
  au.email
FROM profiles p
JOIN units u ON u.id = p.unit_id
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'styleb251@gmail.com';
```

---

#### Criar Assinatura para Beto Style (Manual, até Stripe estar pronto)

```sql
-- Criar assinatura trial manualmente
INSERT INTO subscriptions (unit_id, plan, status, trial_start, trial_end, current_period_start, current_period_end)
VALUES (
  'uuid-da-unit-beto-style',
  'pro',
  'trialing',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW() + INTERVAL '30 days'
);

-- Verificar:
SELECT * FROM subscriptions WHERE unit_id = 'uuid-da-unit-beto-style';
```

---

## 📋 CHECKLIST FINAL - SAAS PRONTO PARA VENDA

### Backend

#### Banco de Dados
- [x] Tabelas existentes (units, profiles, clients, services, etc.)
- [ ] Tabela `subscriptions`
- [ ] Tabela `invoices`
- [ ] Tabela `usage_metrics`
- [ ] Tabela `audit_logs`
- [ ] Tabela `feature_flags`
- [ ] RLS policies para super admin
- [ ] Super admin profile criado (contato@aion3.com.br)
- [x] Primeiro cliente configurado (styleb251@gmail.com)

#### Stripe
- [ ] Conta Stripe criada (modo produção)
- [ ] Produtos criados (Básico, Pro, Enterprise)
- [ ] Preços configurados
- [ ] Webhook endpoint configurado
- [ ] Webhook secret salvo em env
- [ ] Customer Portal ativado

---

### Frontend

#### Páginas Públicas
- [ ] Landing page (`/`)
- [ ] Pricing page (`/pricing`)
- [ ] Signup page (`/signup`)
- [ ] Login page (`/login`)

#### Dashboard Cliente
- [x] Todas as páginas existentes funcionando
- [x] WhatsApp connection com reset
- [x] Personalização visual com upload
- [x] n8n plug-and-play
- [ ] Página de assinatura (`/configuracoes/assinatura`)
- [ ] Customer Portal link

#### Dashboard Super Admin
- [ ] Overview (`/super-admin`)
- [ ] Gestão de tenants (`/super-admin/tenants`)
- [ ] Gestão de assinaturas (`/super-admin/subscriptions`)
- [ ] Analytics (`/super-admin/analytics`)
- [ ] System health (`/super-admin/system`)
- [ ] Logs (`/super-admin/logs`)
- [ ] Configurações globais (`/super-admin/settings`)

#### Onboarding
- [ ] Welcome step
- [ ] WhatsApp setup step
- [ ] Personalization step
- [ ] Automation step
- [ ] Done step

---

### Integração

#### Stripe
- [ ] API route `/api/stripe/create-checkout`
- [ ] API route `/api/stripe/create-portal-session`
- [ ] Webhook `/api/webhooks/stripe`
- [ ] Handler `checkout.session.completed`
- [ ] Handler `invoice.paid`
- [ ] Handler `invoice.payment_failed`
- [ ] Handler `customer.subscription.updated`
- [ ] Handler `customer.subscription.deleted`

#### Usage Limits
- [ ] Função `checkMessageLimit()`
- [ ] Função `checkClientsLimit()`
- [ ] Função `trackMessageSent()`
- [ ] Middleware para enforcement
- [ ] Alert quando atingir 80% do limite

#### Emails (Opcional - Usar Resend ou SendGrid)
- [ ] Email de boas-vindas
- [ ] Email de confirmação de pagamento
- [ ] Email de pagamento falhou
- [ ] Email de suspensão
- [ ] Email de cancelamento

---

### Documentação

- [x] CHECKLIST_FINAL.md
- [x] IMPLEMENTACAO_FINAL_SAAS.md
- [x] SISTEMA_N8N_PLUG_AND_PLAY.md
- [x] GUIA_RAPIDO_N8N.md
- [x] ARQUITETURA_SAAS_WHATSAPP.md
- [x] ANALISE_ESTRATEGICA_SAAS_COMPLETA.md (este documento)
- [ ] README.md atualizado
- [ ] Guia de deploy (Vercel)
- [ ] Guia de configuração Evolution API
- [ ] Guia de configuração Stripe

---

### Infraestrutura

#### Produção
- [ ] Deploy Next.js na Vercel
- [ ] Domínio customizado configurado
- [ ] SSL/HTTPS ativado
- [ ] Variáveis de ambiente configuradas

#### Evolution API
- [ ] VPS contratado (ou serviço gerenciado)
- [ ] Evolution API rodando
- [ ] SSL/HTTPS configurado
- [ ] Webhook testado

#### n8n (Opcional - se centralizado)
- [ ] VPS contratado (ou n8n Cloud)
- [ ] n8n rodando
- [ ] SSL/HTTPS configurado
- [ ] API Key criada

---

### Testes

#### End-to-End
- [ ] Signup completo com Stripe
- [ ] Onboarding guiado
- [ ] WhatsApp conectar + QR Code
- [ ] Enviar mensagem
- [ ] IA responder automaticamente
- [ ] Criar agendamento
- [ ] Receber confirmação de agendamento
- [ ] Fazer upload de logo
- [ ] Mudar cores
- [ ] Instalar workflows n8n
- [ ] Upgrade de plano
- [ ] Downgrade de plano
- [ ] Cancelar assinatura
- [ ] Pagamento falhar → suspender
- [ ] Impersonation (super admin)

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### Semana 1: Super Admin Dashboard
1. Criar tabelas missing (`subscriptions`, `invoices`, etc.)
2. Criar profile super admin
3. Criar rota `/super-admin`
4. Implementar overview com métricas
5. Implementar listagem de tenants
6. Implementar impersonation

### Semana 2: Stripe Integration
1. Criar conta Stripe (produção)
2. Configurar produtos e preços
3. Implementar signup com Stripe Checkout
4. Implementar webhook handler
5. Testar fluxo completo de pagamento
6. Implementar Customer Portal

### Semana 3: Usage Limits & Enforcement
1. Implementar verificação de limites
2. Bloquear ações quando exceder
3. Alerts quando atingir 80%
4. Dashboard mostrando uso atual
5. Sugestão de upgrade automática

### Semana 4: Onboarding & Polish
1. Criar onboarding guiado (4 steps)
2. Emails transacionais
3. Landing page
4. Pricing page
5. Documentação final
6. Deploy em produção

---

## 💡 CONCLUSÃO

### O Que Você Tem Hoje:

✅ **CRM completo e funcional**
✅ **WhatsApp integrado (Evolution API)**
✅ **Automação plug-and-play (n8n + Gemini)**
✅ **White label (logo + cores)**
✅ **Multi-tenant seguro (RLS)**
✅ **Setup facilitado (SQL copy-paste)**
✅ **Primeiro cliente ativo** (styleb251@gmail.com)

### O Que Falta:

❌ **Dashboard super admin** (gestão de tenants)
❌ **Billing com Stripe** (checkout + webhooks)
❌ **Signup automático** (criar tenant ao se cadastrar)
❌ **Usage limits enforcement** (bloquear ao exceder)
❌ **Onboarding guiado** (wizard de 4 passos)
❌ **Landing page + pricing page** (marketing)

### Prioridade de Implementação:

1. 🔴 **CRÍTICO:** Dashboard super admin + Stripe integration
2. 🟠 **ALTA:** Signup automático + Usage limits
3. 🟡 **MÉDIA:** Onboarding guiado + Emails
4. 🟢 **BAIXA:** Landing page + Analytics avançado

### Timeline Estimado:

- **4 semanas** = SaaS 100% funcional e vendável
- **2 meses** = SaaS polido com analytics avançado
- **3 meses** = SaaS maduro com integrações extras

### Break-Even:

- **Custo mensal:** R$ 150-200 (Supabase + Evolution VPS)
- **Break-even:** 2 clientes no Plano Básico (R$ 194/mês)
- **Lucro com 10 clientes:** R$ 1.770/mês (R$ 197 × 10 - R$ 200)
- **Lucro com 50 clientes:** R$ 9.650/mês

---

**Seu SaaS está 85% pronto. Faltam apenas os componentes de billing e super admin para começar a vender!** 🚀

**Primeira Ação Recomendada:** Implementar tabelas de billing e criar super admin dashboard básico.

