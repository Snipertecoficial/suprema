'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Copy, Database, Download } from 'lucide-react'
import { toast } from 'sonner'

const SQL_SCRIPTS = [
  {
    id: '1',
    name: 'Tabelas Principais',
    description: 'Units, Profiles, Clients, Services, Products',
    sql: `-- Tabelas Principais do CRM
-- Execute no Supabase SQL Editor

-- 1. UNITS (Empresas/Clientes do SaaS)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- WhatsApp
  whatsapp_instance_name VARCHAR(255),
  whatsapp_connected BOOLEAN DEFAULT false,
  whatsapp_phone VARCHAR(20),

  -- Personalização
  logo_url TEXT,
  brand_name VARCHAR(255),
  primary_color VARCHAR(20) DEFAULT '#8B5CF6',
  secondary_color VARCHAR(20) DEFAULT '#6B7280',
  accent_color VARCHAR(20) DEFAULT '#EC4899',
  sidebar_bg_color VARCHAR(20) DEFAULT '#FFFFFF',
  custom_css TEXT,

  -- Automação
  n8n_url TEXT,
  n8n_api_key TEXT,
  gemini_api_key TEXT,
  pausa_ia BOOLEAN DEFAULT false
);

-- 2. PROFILES (Usuários)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. CLIENTS (Clientes da empresa)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  cpf VARCHAR(14),
  notes TEXT,
  welcome_sent_at TIMESTAMP,
  last_contact TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. SERVICES (Serviços oferecidos)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  price DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. PRODUCTS (Produtos/Estoque)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_units_slug ON units(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_clients_unit_id ON clients(unit_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_services_unit_id ON services(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);`
  },
  {
    id: '2',
    name: 'Agendamentos',
    description: 'Appointments, Disponibilidade, Configurações',
    sql: `-- Tabelas de Agendamento
-- Execute no Supabase SQL Editor

-- 1. APPOINTMENTS (Agendamentos)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  confirmation_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT appointments_status_check CHECK (
    status IN ('scheduled', 'pending_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show')
  )
);

-- 2. AVAILABILITY (Disponibilidade dos profissionais)
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT availability_day_check CHECK (day_of_week BETWEEN 0 AND 6)
);

-- 3. BOOKING_CONFIG (Configuração de agendamento online)
CREATE TABLE IF NOT EXISTS booking_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT true,
  advance_days_min INTEGER DEFAULT 0,
  advance_days_max INTEGER DEFAULT 30,
  cancellation_hours INTEGER DEFAULT 24,
  slot_duration_minutes INTEGER DEFAULT 30,
  require_phone BOOLEAN DEFAULT true,
  require_email BOOLEAN DEFAULT false,
  custom_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointments_unit_id ON appointments(unit_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_availability_unit_id ON availability(unit_id);
CREATE INDEX IF NOT EXISTS idx_availability_professional ON availability(professional_id);`
  },
  {
    id: '3',
    name: 'WhatsApp e Conversas',
    description: 'WhatsApp Instances, Conversations',
    sql: `-- Tabelas de WhatsApp e Conversas
-- Execute no Supabase SQL Editor

-- 1. WHATSAPP_INSTANCES (Instâncias WhatsApp)
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'disconnected',
  qrcode TEXT,
  phone_number VARCHAR(20),
  connected_at TIMESTAMP,
  disconnected_at TIMESTAMP,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CONVERSATIONS (Mensagens WhatsApp)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  sender VARCHAR(20) NOT NULL, -- 'client' ou 'agent'
  message TEXT,
  whatsapp_message_id VARCHAR(255),
  media_url TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  is_read BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT NOW(),

  CONSTRAINT conversations_sender_check CHECK (sender IN ('client', 'agent'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_unit_id ON whatsapp_instances(unit_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_name ON whatsapp_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_conversations_unit_id ON conversations(unit_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);`
  },
  {
    id: '4',
    name: 'Financeiro',
    description: 'Transactions, Payment Methods, Commissions',
    sql: `-- Tabelas Financeiras
-- Execute no Supabase SQL Editor

-- 1. PAYMENT_METHODS (Formas de Pagamento)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  installments_max INTEGER DEFAULT 1,
  fee_percentage DECIMAL(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT payment_methods_type_check CHECK (
    type IN ('money', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'other')
  )
);

-- 2. TRANSACTIONS (Transações Financeiras)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense')),
  CONSTRAINT transactions_status_check CHECK (
    status IN ('pending', 'paid', 'cancelled', 'overdue')
  )
);

-- 3. COMMISSIONS (Comissões)
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  percentage DECIMAL(5,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT commissions_status_check CHECK (status IN ('pending', 'paid', 'cancelled'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_methods_unit_id ON payment_methods(unit_id);
CREATE INDEX IF NOT EXISTS idx_transactions_unit_id ON transactions(unit_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_commissions_unit_id ON commissions(unit_id);
CREATE INDEX IF NOT EXISTS idx_commissions_professional ON commissions(professional_id);`
  },
  {
    id: '5',
    name: 'Row Level Security (RLS)',
    description: 'Políticas de segurança multi-tenant',
    sql: `-- Row Level Security (RLS) para Multi-Tenant
-- Execute no Supabase SQL Editor

-- =====================================================
-- ATIVAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES PARA UNITS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own unit" ON units;
CREATE POLICY "Users can view their own unit"
ON units FOR SELECT
TO authenticated
USING (id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own unit" ON units;
CREATE POLICY "Users can update their own unit"
ON units FOR UPDATE
TO authenticated
USING (id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- =====================================================
-- POLICIES PARA PROFILES
-- =====================================================

DROP POLICY IF EXISTS "Users can view profiles from their unit" ON profiles;
CREATE POLICY "Users can view profiles from their unit"
ON profiles FOR SELECT
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- =====================================================
-- POLICIES PARA CLIENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view clients from their unit" ON clients;
CREATE POLICY "Users can view clients from their unit"
ON clients FOR SELECT
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert clients to their unit" ON clients;
CREATE POLICY "Users can insert clients to their unit"
ON clients FOR INSERT
TO authenticated
WITH CHECK (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update clients from their unit" ON clients;
CREATE POLICY "Users can update clients from their unit"
ON clients FOR UPDATE
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- =====================================================
-- APLICAR MESMA LÓGICA PARA TODAS AS OUTRAS TABELAS
-- =====================================================

-- SERVICES
DROP POLICY IF EXISTS "Users manage services from their unit" ON services;
CREATE POLICY "Users manage services from their unit"
ON services FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- PRODUCTS
DROP POLICY IF EXISTS "Users manage products from their unit" ON products;
CREATE POLICY "Users manage products from their unit"
ON products FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Users manage appointments from their unit" ON appointments;
CREATE POLICY "Users manage appointments from their unit"
ON appointments FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- AVAILABILITY
DROP POLICY IF EXISTS "Users manage availability from their unit" ON availability;
CREATE POLICY "Users manage availability from their unit"
ON availability FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- WHATSAPP_INSTANCES
DROP POLICY IF EXISTS "Users manage whatsapp from their unit" ON whatsapp_instances;
CREATE POLICY "Users manage whatsapp from their unit"
ON whatsapp_instances FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users manage conversations from their unit" ON conversations;
CREATE POLICY "Users manage conversations from their unit"
ON conversations FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- PAYMENT_METHODS
DROP POLICY IF EXISTS "Users manage payment methods from their unit" ON payment_methods;
CREATE POLICY "Users manage payment methods from their unit"
ON payment_methods FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users manage transactions from their unit" ON transactions;
CREATE POLICY "Users manage transactions from their unit"
ON transactions FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- COMMISSIONS
DROP POLICY IF EXISTS "Users manage commissions from their unit" ON commissions;
CREATE POLICY "Users manage commissions from their unit"
ON commissions FOR ALL
TO authenticated
USING (unit_id IN (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- ✅ RLS CONFIGURADO COM SUCESSO!
-- Agora cada usuário só vê dados da sua unit (multi-tenant)`
  }
]

export default function SetupDatabasePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql)
    setCopiedId(id)
    toast.success('SQL copiado para área de transferência!')

    setTimeout(() => setCopiedId(null), 2000)
  }

  const downloadSQL = (sql: string, filename: string) => {
    const blob = new Blob([sql], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.sql`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('SQL baixado!')
  }

  const copyAllScripts = () => {
    const allSQL = SQL_SCRIPTS.map(script =>
      `-- ========================================\n-- ${script.name}\n-- ${script.description}\n-- ========================================\n\n${script.sql}`
    ).join('\n\n\n')

    navigator.clipboard.writeText(allSQL)
    toast.success('Todos os scripts SQL copiados!')
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          Setup do Banco de Dados
        </h1>
        <p className="text-gray-500 mt-1">
          Scripts SQL prontos para criar todas as tabelas no Supabase
        </p>
      </div>

      {/* Botão copiar tudo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Copiar Todos os Scripts</CardTitle>
          <CardDescription className="text-blue-700">
            Recomendado: Copie todos os scripts de uma vez e execute no Supabase SQL Editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={copyAllScripts} className="bg-blue-600 hover:bg-blue-700">
            <Copy className="mr-2 h-4 w-4" />
            Copiar Tudo (5 Scripts)
          </Button>
        </CardContent>
      </Card>

      {/* Scripts individuais */}
      <div className="space-y-4">
        {SQL_SCRIPTS.map((script, index) => (
          <Card key={script.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </span>
                    {script.name}
                  </CardTitle>
                  <CardDescription>{script.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(script.sql, script.id)}
                  >
                    {copiedId === script.id ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar SQL
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSQL(script.sql, script.name.toLowerCase().replace(/\s+/g, '-'))}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                <code>{script.sql}</code>
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instruções */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Como usar:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Clique em "Copiar Tudo" acima</li>
            <li>Abra seu Supabase: <code className="bg-green-100 px-2 py-1 rounded">https://supabase.com/dashboard/project/SEU_PROJETO/sql</code></li>
            <li>Cole o SQL copiado no editor</li>
            <li>Clique em "Run" para executar</li>
            <li>Pronto! Todas as tabelas foram criadas com RLS configurado!</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
