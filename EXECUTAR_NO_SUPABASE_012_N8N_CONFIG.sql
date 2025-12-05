-- ================================================
-- ADICIONAR CONFIGURAÇÃO N8N E GEMINI
-- Execute este script no Supabase SQL Editor
-- ================================================

-- 1. Adicionar campos para configuração n8n e Gemini API
ALTER TABLE units
ADD COLUMN IF NOT EXISTS n8n_url TEXT,
ADD COLUMN IF NOT EXISTS n8n_api_key TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- 2. Adicionar campos para controle de boas-vindas em clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_contact TIMESTAMP;

-- 3. Adicionar campos para controle de confirmação em appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP;

-- Atualizar status para incluir pending_confirmation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'appointments_status_check'
    ) THEN
        ALTER TABLE appointments
        DROP CONSTRAINT IF EXISTS appointments_status_check;

        ALTER TABLE appointments
        ADD CONSTRAINT appointments_status_check
        CHECK (status IN ('scheduled', 'pending_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show'));
    END IF;
END $$;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_welcome_sent ON clients(welcome_sent_at);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_sent ON appointments(confirmation_sent_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled ON appointments(status, scheduled_at);

-- 5. Comentários para documentação
COMMENT ON COLUMN units.n8n_url IS 'URL do servidor n8n do cliente';
COMMENT ON COLUMN units.n8n_api_key IS 'API Key do n8n para automações';
COMMENT ON COLUMN units.gemini_api_key IS 'Google Gemini API Key para IA';
COMMENT ON COLUMN clients.welcome_sent_at IS 'Timestamp do envio da mensagem de boas-vindas';
COMMENT ON COLUMN clients.last_contact IS 'Timestamp do último contato com o cliente';
COMMENT ON COLUMN appointments.confirmation_sent_at IS 'Timestamp do envio da confirmação de agendamento';

-- ================================================
-- RESUMO
-- ================================================
-- ✅ Campos n8n_url, n8n_api_key e gemini_api_key adicionados em units
-- ✅ Campos welcome_sent_at e last_contact adicionados em clients
-- ✅ Campo confirmation_sent_at adicionado em appointments
-- ✅ Status 'pending_confirmation' adicionado em appointments
-- ✅ Índices criados para performance
