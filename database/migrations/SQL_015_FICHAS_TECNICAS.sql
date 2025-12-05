-- ============================================================================
-- MIGRAÇÃO 015 - FICHAS TÉCNICAS E BAIXA AUTOMÁTICA DE ESTOQUE
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- 1. TABELA DE FICHAS TÉCNICAS (Produtos por Serviço)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0), -- Quantidade necessária (pode ser decimal: 0.5ml, etc)
  unit VARCHAR(20) DEFAULT 'unidade', -- 'ml', 'g', 'unidade', 'pct', etc
  notes TEXT, -- Observações sobre o uso
  is_optional BOOLEAN DEFAULT false, -- Se o produto é opcional na fórmula
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(service_id, product_id) -- Não permitir produto duplicado no mesmo serviço
);

-- 2. HISTÓRICO DE CONSUMO (Para relatórios e análise)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_consumption (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_used DECIMAL(10,3) NOT NULL, -- Quantidade realmente usada
  unit VARCHAR(20),
  consumed_at TIMESTAMP DEFAULT NOW(),
  consumed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_service_formulas_service ON service_formulas(service_id);
CREATE INDEX IF NOT EXISTS idx_service_formulas_product ON service_formulas(product_id);
CREATE INDEX IF NOT EXISTS idx_service_consumption_appointment ON service_consumption(appointment_id);
CREATE INDEX IF NOT EXISTS idx_service_consumption_service ON service_consumption(service_id);
CREATE INDEX IF NOT EXISTS idx_service_consumption_product ON service_consumption(product_id);
CREATE INDEX IF NOT EXISTS idx_service_consumption_date ON service_consumption(consumed_at DESC);

-- 4. FUNÇÃO PARA BAIXAR ESTOQUE AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION baixar_estoque_ao_finalizar_servico()
RETURNS TRIGGER AS $$
DECLARE
  v_service_record RECORD;
  v_formula_record RECORD;
  v_product_record RECORD;
  v_current_stock DECIMAL(10,2);
  v_new_stock DECIMAL(10,2);
BEGIN
  -- Executar apenas quando status muda para 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Buscar informações do serviço do agendamento
    SELECT s.* INTO v_service_record
    FROM services s
    WHERE s.id = NEW.service_id;

    IF NOT FOUND THEN
      RAISE WARNING 'Serviço não encontrado para agendamento %', NEW.id;
      RETURN NEW;
    END IF;

    -- Para cada produto na ficha técnica do serviço
    FOR v_formula_record IN
      SELECT * FROM service_formulas
      WHERE service_id = NEW.service_id
    LOOP
      -- Buscar produto atual
      SELECT * INTO v_product_record
      FROM products
      WHERE id = v_formula_record.product_id
        AND unit_id = NEW.unit_id; -- Garantir que é da mesma unidade

      IF NOT FOUND THEN
        RAISE WARNING 'Produto % não encontrado na unidade para serviço %', 
          v_formula_record.product_id, NEW.service_id;
        CONTINUE;
      END IF;

      -- Verificar se há estoque suficiente
      v_current_stock := v_product_record.current_stock;
      
      IF v_current_stock < v_formula_record.quantity THEN
        RAISE WARNING 'Estoque insuficiente para produto % (disponível: %, necessário: %)', 
          v_product_record.name, v_current_stock, v_formula_record.quantity;
        
        -- Se não for opcional, logar erro mas continuar
        IF NOT v_formula_record.is_optional THEN
          -- Registrar consumo mesmo sem estoque (para controle)
          INSERT INTO service_consumption (
            appointment_id,
            service_id,
            product_id,
            quantity_used,
            unit,
            consumed_by
          ) VALUES (
            NEW.id,
            NEW.service_id,
            v_formula_record.product_id,
            v_formula_record.quantity,
            v_formula_record.unit,
            NEW.professional_id
          );
        END IF;
        
        CONTINUE;
      END IF;

      -- Baixar estoque
      v_new_stock := v_current_stock - v_formula_record.quantity;

      UPDATE products
      SET current_stock = v_new_stock,
          updated_at = NOW()
      WHERE id = v_product_record.id;

      -- Registrar movimentação de estoque
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        unit_price,
        total_value,
        notes,
        created_by
      ) VALUES (
        v_product_record.id,
        'consumption',
        -v_formula_record.quantity, -- Negativo = saída
        v_product_record.cost_price,
        v_product_record.cost_price * v_formula_record.quantity,
        'Baixa automática - Serviço: ' || v_service_record.name || ' (Agendamento: ' || NEW.id::TEXT || ')',
        NEW.professional_id
      );

      -- Registrar consumo
      INSERT INTO service_consumption (
        appointment_id,
        service_id,
        product_id,
        quantity_used,
        unit,
        consumed_by
      ) VALUES (
        NEW.id,
        NEW.service_id,
        v_formula_record.product_id,
        v_formula_record.quantity,
        v_formula_record.unit,
        NEW.professional_id
      );

      -- Verificar se estoque ficou baixo e enviar alerta (se implementado)
      IF v_new_stock <= v_product_record.min_stock THEN
        RAISE NOTICE 'Alerta: Estoque baixo para produto % (atual: %, mínimo: %)',
          v_product_record.name, v_new_stock, v_product_record.min_stock;
        -- Aqui poderia enviar notificação (email, webhook, etc)
      END IF;

    END LOOP;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA BAIXA AUTOMÁTICA
-- ============================================================================

DROP TRIGGER IF EXISTS trg_baixar_estoque_ao_finalizar ON appointments;

CREATE TRIGGER trg_baixar_estoque_ao_finalizar
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
  EXECUTE FUNCTION baixar_estoque_ao_finalizar_servico();

-- 6. FUNÇÃO PARA VERIFICAR ESTOQUE ANTES DE AGENDAR
-- ============================================================================

CREATE OR REPLACE FUNCTION verificar_estoque_servico(
  p_service_id UUID,
  p_unit_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(255),
  required_quantity DECIMAL(10,3),
  available_stock DECIMAL(10,2),
  unit VARCHAR(20),
  is_sufficient BOOLEAN,
  is_optional BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    sf.quantity AS required_quantity,
    p.current_stock AS available_stock,
    sf.unit,
    (p.current_stock >= sf.quantity) AS is_sufficient,
    sf.is_optional
  FROM service_formulas sf
  INNER JOIN products p ON p.id = sf.product_id
  WHERE sf.service_id = p_service_id
    AND p.unit_id = p_unit_id
  ORDER BY sf.is_optional ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA RELATÓRIO DE CONSUMO
-- ============================================================================

CREATE OR REPLACE FUNCTION relatorio_consumo_produtos(
  p_unit_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(255),
  total_consumido DECIMAL(10,3),
  unit VARCHAR(20),
  numero_servicos INTEGER,
  valor_total DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    SUM(sc.quantity_used) AS total_consumido,
    sc.unit,
    COUNT(DISTINCT sc.service_id) AS numero_servicos,
    SUM(sc.quantity_used * p.cost_price) AS valor_total
  FROM service_consumption sc
  INNER JOIN products p ON p.id = sc.product_id
  INNER JOIN appointments a ON a.id = sc.appointment_id
  WHERE a.unit_id = p_unit_id
    AND DATE(sc.consumed_at) BETWEEN p_start_date AND p_end_date
  GROUP BY p.id, p.name, sc.unit
  ORDER BY total_consumido DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. HABILITAR RLS
-- ============================================================================

ALTER TABLE service_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_consumption ENABLE ROW LEVEL SECURITY;

-- Políticas para service_formulas
CREATE POLICY "Users view service formulas from own unit" ON service_formulas
  FOR SELECT USING (
    service_id IN (
      SELECT id FROM services WHERE unit_id = get_my_unit_id()
    )
  );

CREATE POLICY "Admins manage service formulas" ON service_formulas
  FOR ALL USING (
    service_id IN (
      SELECT id FROM services WHERE unit_id = get_my_unit_id()
    ) AND get_my_role() IN ('admin', 'super_admin')
  );

-- Políticas para service_consumption
CREATE POLICY "Users view service consumption from own unit" ON service_consumption
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE unit_id = get_my_unit_id()
    )
  );

-- ============================================================================
-- FIM DA MIGRAÇÃO 015
-- ============================================================================




