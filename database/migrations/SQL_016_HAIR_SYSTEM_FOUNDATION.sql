-- =============================================================================
-- MIGRAÇÃO 016 - FUNDAÇÃO HAIR SYSTEM
-- Estrutura mínima para POS/comanda, pagamentos múltiplos, fidelidade, comissões
-- e trilha de auditoria alinhada às funcionalidades pedidas (Nob/Hair System).
-- Execute no Supabase SQL Editor.
-- =============================================================================

-- =========================
-- 1. COMANDAS / POS ORDERS
-- =========================
CREATE TABLE IF NOT EXISTS pos_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  group_tab_id UUID REFERENCES pos_orders(id) ON DELETE SET NULL, -- agrupamento de comandas
  status TEXT NOT NULL DEFAULT 'open', -- open | closed | cancelled
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount_value NUMERIC(12,2) DEFAULT 0,
  discount_reason TEXT,
  service_fee NUMERIC(12,2) DEFAULT 0, -- taxa opcional
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_orders_unit ON pos_orders(unit_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_client ON pos_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_status ON pos_orders(status);

-- =========================
-- 2. ITENS DE COMANDA
-- =========================
CREATE TABLE IF NOT EXISTS pos_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product')),
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_value NUMERIC(12,2) DEFAULT 0,
  commission_rule_id UUID REFERENCES commission_rules(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_order ON pos_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_items_professional ON pos_order_items(professional_id);

-- =========================
-- 3. PAGAMENTOS (MULTIPLOS)
-- =========================
CREATE TABLE IF NOT EXISTS pos_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('cash','card','pix','stripe','wallet','points','courtesy')),
  amount NUMERIC(12,2) NOT NULL,
  change_given NUMERIC(12,2) DEFAULT 0,
  stripe_payment_intent_id TEXT,
  external_reference TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pos_payments_order ON pos_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_payments_method ON pos_payments(method);

-- =========================
-- 4. PROGRAMAS DE FIDELIDADE / CARTEIRA
-- =========================
CREATE TABLE IF NOT EXISTS loyalty_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  points_balance NUMERIC(12,2) DEFAULT 0,
  credits_balance NUMERIC(12,2) DEFAULT 0,
  UNIQUE(unit_id, client_id)
);

CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES loyalty_wallets(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('earning','redeem','adjustment')),
  points_delta NUMERIC(12,2) DEFAULT 0,
  credits_delta NUMERIC(12,2) DEFAULT 0,
  reference_order_id UUID REFERENCES pos_orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_loyalty_wallets_unit ON loyalty_wallets(unit_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_wallet ON loyalty_ledger(wallet_id);

-- =========================
-- 5. REGRAS E LANÇAMENTOS DE COMISSÃO
-- =========================
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('service','product')),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  base_type TEXT NOT NULL DEFAULT 'gross' CHECK (base_type IN ('gross','net_material','net_card_fee')),
  percentage NUMERIC(6,3) NOT NULL, -- ex: 0.5 = 50%
  fixed_cost NUMERIC(12,2) DEFAULT 0,
  card_fee_share NUMERIC(6,3) DEFAULT 0, -- parte da taxa de cartão descontada antes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_unit ON commission_rules(unit_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_service ON commission_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_product ON commission_rules(product_id);

CREATE TABLE IF NOT EXISTS commission_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES pos_order_items(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES commission_rules(id) ON DELETE SET NULL,
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
  payable_at DATE,
  paid_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_entries_professional ON commission_entries(professional_id);
CREATE INDEX IF NOT EXISTS idx_commission_entries_status ON commission_entries(status);

-- =========================
-- 6. AUDITORIA / VIGIA
-- =========================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_unit ON audit_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);

-- =========================
-- 7. AGENDAMENTO ONLINE / LINKS PÚBLICOS
-- =========================
CREATE TABLE IF NOT EXISTS booking_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  published_services UUID[] DEFAULT '{}',
  allow_professional_selection BOOLEAN DEFAULT true,
  min_lead_time_minutes INTEGER DEFAULT 60,
  max_lead_time_days INTEGER DEFAULT 60,
  requires_manual_confirmation BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- =========================
-- 8. DESPESAS (CONTAS A PAGAR)
-- =========================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  supplier TEXT,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  paid_at DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','scheduled','paid','canceled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_unit ON expenses(unit_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);

-- =========================
-- 9. RLS (segurança por tenant)
-- =========================
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas básicas assumindo função get_my_unit_id() existente
CREATE POLICY "tenant-can-select-pos-orders" ON pos_orders
  FOR SELECT USING (unit_id = get_my_unit_id());
CREATE POLICY "tenant-can-modify-pos-orders" ON pos_orders
  FOR ALL USING (unit_id = get_my_unit_id());

CREATE POLICY "tenant-can-select-pos-order-items" ON pos_order_items
  FOR SELECT USING (order_id IN (SELECT id FROM pos_orders WHERE unit_id = get_my_unit_id()));
CREATE POLICY "tenant-can-modify-pos-order-items" ON pos_order_items
  FOR ALL USING (order_id IN (SELECT id FROM pos_orders WHERE unit_id = get_my_unit_id()));

CREATE POLICY "tenant-can-select-pos-payments" ON pos_payments
  FOR SELECT USING (order_id IN (SELECT id FROM pos_orders WHERE unit_id = get_my_unit_id()));
CREATE POLICY "tenant-can-modify-pos-payments" ON pos_payments
  FOR ALL USING (order_id IN (SELECT id FROM pos_orders WHERE unit_id = get_my_unit_id()));

CREATE POLICY "tenant-can-select-loyalty-wallets" ON loyalty_wallets
  FOR SELECT USING (unit_id = get_my_unit_id());
CREATE POLICY "tenant-can-modify-loyalty-wallets" ON loyalty_wallets
  FOR ALL USING (unit_id = get_my_unit_id());

CREATE POLICY "tenant-can-select-loyalty-ledger" ON loyalty_ledger
  FOR SELECT USING (wallet_id IN (SELECT id FROM loyalty_wallets WHERE unit_id = get_my_unit_id()));
CREATE POLICY "tenant-can-modify-loyalty-ledger" ON loyalty_ledger
  FOR ALL USING (wallet_id IN (SELECT id FROM loyalty_wallets WHERE unit_id = get_my_unit_id()));

CREATE POLICY "tenant-can-select-commission-rules" ON commission_rules
  FOR SELECT USING (unit_id = get_my_unit_id());
CREATE POLICY "tenant-can-modify-commission-rules" ON commission_rules
  FOR ALL USING (unit_id = get_my_unit_id());

CREATE POLICY "tenant-can-select-commission-entries" ON commission_entries
  FOR SELECT USING (order_item_id IN (
    SELECT poi.id FROM pos_order_items poi
    JOIN pos_orders po ON po.id = poi.order_id
    WHERE po.unit_id = get_my_unit_id()
  ));
CREATE POLICY "tenant-can-modify-commission-entries" ON commission_entries
  FOR ALL USING (order_item_id IN (
    SELECT poi.id FROM pos_order_items poi
    JOIN pos_orders po ON po.id = poi.order_id
    WHERE po.unit_id = get_my_unit_id()
  ));

CREATE POLICY "tenant-can-select-audit-logs" ON audit_logs
  FOR SELECT USING (unit_id = get_my_unit_id());
CREATE POLICY "tenant-can-insert-audit-logs" ON audit_logs
  FOR INSERT WITH CHECK (unit_id = get_my_unit_id());

CREATE POLICY "tenant-can-select-booking-links" ON booking_links
  FOR SELECT USING (unit_id = get_my_unit_id());
CREATE POLICY "tenant-can-modify-booking-links" ON booking_links
  FOR ALL USING (unit_id = get_my_unit_id());

CREATE POLICY "tenant-can-select-expenses" ON expenses
  FOR SELECT USING (unit_id = get_my_unit_id());
CREATE POLICY "tenant-can-modify-expenses" ON expenses
  FOR ALL USING (unit_id = get_my_unit_id());

-- =============================================================================
-- FIM DA MIGRAÇÃO 016
-- =============================================================================
