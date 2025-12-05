-- =====================================================
-- CONFIGURAR CHAVES MASTER (System Settings)
-- =====================================================
-- Execute APÓS criar o Super Admin
-- Pode ser feito via SQL ou via Dashboard Super Admin
-- =====================================================

-- =====================================================
-- OPÇÃO 1: Configurar via SQL (Mais Rápido)
-- =====================================================

-- IMPORTANTE: Substitua os valores abaixo pelas suas chaves reais

UPDATE system_settings
SET
  -- Gemini API Key (obrigatório para IA)
  gemini_api_key_master = 'AIzaSy...', -- ⚠️ SUBSTITUIR pela sua chave real

  -- Evolution API Global Token (obrigatório para WhatsApp)
  evolution_api_global_token = 'seu-token-evolution', -- ⚠️ SUBSTITUIR

  -- Evolution API Base URL
  evolution_api_base_url = 'https://evolution.aion3.com.br', -- Alterar se necessário

  -- OpenAI API Key (opcional - para futuro)
  openai_api_key_master = NULL, -- Deixar NULL por enquanto

  -- Configurações de IA
  ai_model_name = 'gemini-1.5-pro', -- Modelo do Gemini
  max_tokens_per_request = 4096, -- Máximo de tokens por resposta

  -- Modo manutenção (inicialmente desativado)
  maintenance_mode = false,
  maintenance_message = 'Sistema em manutenção. Voltamos em breve.',

  -- n8n (opcional - se centralizado)
  n8n_base_url = NULL, -- Deixar NULL se cada cliente usa seu próprio n8n

  updated_at = NOW()

WHERE id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- PASSO 2: Verificar se foi salvo corretamente
-- =====================================================

SELECT
  id,
  CASE
    WHEN gemini_api_key_master IS NOT NULL THEN '✅ Configurada'
    ELSE '❌ Não configurada'
  END as gemini_status,
  CASE
    WHEN evolution_api_global_token IS NOT NULL THEN '✅ Configurada'
    ELSE '❌ Não configurada'
  END as evolution_status,
  evolution_api_base_url,
  ai_model_name,
  max_tokens_per_request,
  maintenance_mode,
  created_at,
  updated_at
FROM system_settings;

-- Resultado esperado:
-- | id       | gemini_status    | evolution_status | evolution_api_base_url          | ai_model_name  | max_tokens | maintenance_mode | created_at | updated_at |
-- |----------|------------------|------------------|---------------------------------|----------------|------------|------------------|------------|------------|
-- | 000...01 | ✅ Configurada   | ✅ Configurada   | https://evolution.aion3.com.br  | gemini-1.5-pro | 4096       | false            | 2025-12-03 | 2025-12-03 |

-- =====================================================
-- OPÇÃO 2: Configurar via Dashboard Super Admin
-- =====================================================
-- (Recomendado quando o dashboard estiver pronto)

-- 1. Criar página: /app/super-admin/settings/page.tsx
-- 2. Login como super admin (contato@aion3.com.br)
-- 3. Acesse: http://localhost:3000/super-admin/settings
-- 4. Preencha os campos:
--    - Gemini API Key Master
--    - Evolution API Global Token
-- 5. Clique em "Salvar"
-- 6. Sistema irá:
--    - Atualizar system_settings
--    - Invalidar cache
--    - Mostrar confirmação

-- =====================================================
-- COMO OBTER AS CHAVES
-- =====================================================

-- 1. GEMINI API KEY (Google AI Studio)
-- =====================================================
-- Passo a passo:
-- 1. Acesse: https://makersuite.google.com/app/apikey
-- 2. Faça login com sua conta Google
-- 3. Clique em "Create API Key"
-- 4. Selecione um projeto Google Cloud (ou crie um novo)
-- 5. Copie a key gerada (começa com AIza...)
-- 6. Cole no campo gemini_api_key_master acima

-- Formato da chave: AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

-- 2. EVOLUTION API GLOBAL TOKEN
-- =====================================================
-- Se você está usando Evolution API próprio:
-- 1. Acesse seu painel Evolution API
-- 2. Vá em Settings → API
-- 3. Copie o Global API Key
-- 4. Cole no campo evolution_api_global_token acima

-- Se está usando serviço gerenciado:
-- 1. Entre em contato com o provedor
-- 2. Solicite o API Token
-- 3. Configure o evolution_api_base_url também

-- =====================================================
-- TESTAR SE AS CHAVES ESTÃO FUNCIONANDO
-- =====================================================

-- Teste 1: Verificar se consegue buscar as chaves
-- (Simula o que o código faz)

SELECT
  CASE
    WHEN gemini_api_key_master IS NOT NULL AND LENGTH(gemini_api_key_master) > 20
    THEN '✅ Gemini API Key válida'
    ELSE '❌ Gemini API Key inválida ou não configurada'
  END as gemini_check,
  CASE
    WHEN evolution_api_global_token IS NOT NULL AND LENGTH(evolution_api_global_token) > 10
    THEN '✅ Evolution Token válido'
    ELSE '❌ Evolution Token inválido ou não configurado'
  END as evolution_check
FROM system_settings;

-- =====================================================
-- SEGURANÇA: Verificar RLS
-- =====================================================

-- Tentar acessar como usuário normal (deve falhar)
-- Faça login como Beto Style e tente:

SELECT * FROM system_settings;

-- Resultado esperado:
-- ❌ Erro: new row violates row-level security policy
-- OU retorna vazio (sem permissão para ver)

-- Como super admin, deve funcionar:
-- Faça login como contato@aion3.com.br e tente:

SELECT * FROM system_settings;

-- Resultado esperado:
-- ✅ Retorna 1 linha com todas as configurações

-- =====================================================
-- ATUALIZAR CHAVES (Quando expirar ou mudar)
-- =====================================================

-- Atualizar apenas Gemini API Key:
UPDATE system_settings
SET gemini_api_key_master = 'nova-chave-aqui',
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Atualizar apenas Evolution Token:
UPDATE system_settings
SET evolution_api_global_token = 'novo-token-aqui',
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- MODO MANUTENÇÃO (Ativar/Desativar)
-- =====================================================

-- Ativar modo manutenção:
UPDATE system_settings
SET maintenance_mode = true,
    maintenance_message = 'Estamos realizando melhorias. Voltamos às 14h.',
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Desativar modo manutenção:
UPDATE system_settings
SET maintenance_mode = false,
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- BACKUP DAS CHAVES (Recomendado)
-- =====================================================

-- Exportar chaves para backup local:
SELECT
  gemini_api_key_master,
  evolution_api_global_token,
  evolution_api_base_url
FROM system_settings;

-- IMPORTANTE:
-- 1. Salve em local seguro (ex: 1Password, Bitwarden)
-- 2. NÃO commite no Git
-- 3. NÃO compartilhe publicamente

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- Problema: "Gemini API Key Master não configurada"
-- Solução: Execute o UPDATE acima com sua chave real

-- Problema: "Cache não está sendo invalidado"
-- Solução: Reinicie o servidor Next.js:
-- CTRL+C no terminal e npm run dev novamente

-- Problema: "Chave funciona no teste mas não no código"
-- Solução:
-- 1. Verifique se tem cache TTL de 5 minutos
-- 2. Aguarde 5 minutos ou reinicie servidor
-- 3. Chame invalidateSettingsCache() via API Route

-- Ver quando foi a última atualização:
SELECT updated_at FROM system_settings;

-- Se foi há mais de 5 minutos, cache já deve ter expirado

-- =====================================================
-- EXEMPLO: Testar geração de IA via SQL
-- =====================================================

-- Simular incremento de uso de IA:
SELECT increment_ai_usage(
  'uuid-da-unit-beto-style', -- ⚠️ Substituir pelo UUID real
  1000, -- Input tokens
  500   -- Output tokens
);

-- Ver uso registrado:
SELECT * FROM ai_usage_metrics
WHERE unit_id = 'uuid-da-unit-beto-style'; -- ⚠️ Substituir

-- Resultado esperado:
-- | id  | unit_id | month_year | input_tokens | output_tokens | messages_count | estimated_cost_usd | created_at | updated_at |
-- |-----|---------|------------|--------------|---------------|----------------|-------------------|------------|------------|
-- | xxx | yyy     | 12-2025    | 1000         | 500           | 1              | 0.0038            | ...        | ...        |
