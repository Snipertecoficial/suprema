/**
 * =====================================================
 * GEMINI AI SERVICE - CENTRALIZADO
 * =====================================================
 * Usa chave master do Super Admin (system_settings)
 * Rastreia uso por tenant (ai_usage_metrics)
 * NUNCA expõe chave para o cliente
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { getGeminiMasterKey, getGlobalSettings } from './systemSettings'
import { createClient } from '@/lib/supabase/server'

// Interface para resposta da IA
export interface GeminiResponse {
  text: string
  inputTokens: number
  outputTokens: number
}

// Cache da instância do Gemini (evitar reinicializar a cada chamada)
let geminiInstance: GoogleGenerativeAI | null = null

/**
 * Inicializa a instância do Gemini
 * Usa a chave master do banco de dados
 */
async function getGeminiInstance(): Promise<GoogleGenerativeAI> {
  if (geminiInstance) {
    return geminiInstance
  }

  // Buscar chave master (com cache)
  const apiKey = await getGeminiMasterKey()

  // Inicializar Gemini
  geminiInstance = new GoogleGenerativeAI(apiKey)

  return geminiInstance
}

/**
 * Gera resposta usando Gemini AI
 * Rastreia uso por tenant automaticamente
 *
 * @param prompt - Prompt para a IA
 * @param unitId - ID da unit (tenant) para rastreamento
 * @param systemInstruction - Instrução de sistema (opcional)
 * @returns Resposta da IA + métricas de tokens
 */
export async function generateAIResponse(
  prompt: string,
  unitId: string,
  systemInstruction?: string
): Promise<GeminiResponse> {
  // 1. Verificar se AI está habilitada para o tenant
  const supabase = createClient()

  const { data: unit, error: unitError } = await supabase
    .from('units')
    .select('ai_features_enabled, ai_paused')
    .eq('id', unitId)
    .single()

  if (unitError || !unit) {
    throw new Error('Unit não encontrada')
  }

  if (!unit.ai_features_enabled) {
    throw new Error('AI features não estão habilitadas para este tenant')
  }

  if (unit.ai_paused) {
    throw new Error('AI está pausada para este tenant')
  }

  // 2. Buscar configurações globais
  const settings = await getGlobalSettings()

  // 3. Inicializar Gemini
  const genAI = await getGeminiInstance()
  const model = genAI.getGenerativeModel({
    model: settings.ai_model_name || 'gemini-1.5-pro',
    generationConfig: {
      maxOutputTokens: settings.max_tokens_per_request || 4096,
      temperature: 0.7,
    },
    systemInstruction: systemInstruction || undefined
  })

  // 4. Gerar resposta
  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  // 5. Extrair métricas de uso
  const usageMetadata = response.usageMetadata
  const inputTokens = usageMetadata?.promptTokenCount || 0
  const outputTokens = usageMetadata?.candidatesTokenCount || 0

  // 6. Rastrear uso (async, não bloqueia resposta)
  trackAIUsage(unitId, inputTokens, outputTokens).catch(err => {
    console.error('❌ Erro ao rastrear uso de IA:', err)
  })

  // 7. Retornar resposta
  return {
    text,
    inputTokens,
    outputTokens
  }
}

/**
 * Rastreia uso de IA por tenant
 * Chama função do banco que atualiza ai_usage_metrics
 */
async function trackAIUsage(
  unitId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const supabase = createClient()

  // Chamar função SQL que incrementa métricas
  const { error } = await supabase.rpc('increment_ai_usage', {
    p_unit_id: unitId,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens
  })

  if (error) {
    console.error('❌ Erro ao rastrear uso de IA:', error)
    throw error
  }

  console.log(`✅ Uso de IA rastreado - Unit: ${unitId}, Input: ${inputTokens}, Output: ${outputTokens}`)
}

/**
 * Gera resposta contextual para WhatsApp
 * Inclui contexto da conversa e informações do cliente
 *
 * @param message - Mensagem do cliente
 * @param unitId - ID do tenant
 * @param clientName - Nome do cliente
 * @param conversationHistory - Histórico recente de mensagens (opcional)
 */
export async function generateWhatsAppResponse(
  message: string,
  unitId: string,
  clientName: string,
  conversationHistory?: Array<{ sender: string; message: string }>
): Promise<string> {
  // Buscar nome da unit
  const supabase = createClient()
  const { data: unit } = await supabase
    .from('units')
    .select('name, brand_name')
    .eq('id', unitId)
    .single()

  const businessName = unit?.brand_name || unit?.name || 'Nosso negócio'

  // Montar contexto
  let contextPrompt = `Você é um assistente virtual da ${businessName}.\n\n`

  if (conversationHistory && conversationHistory.length > 0) {
    contextPrompt += `Histórico da conversa:\n`
    conversationHistory.forEach(msg => {
      contextPrompt += `${msg.sender}: ${msg.message}\n`
    })
    contextPrompt += `\n`
  }

  contextPrompt += `Cliente: ${clientName}\n`
  contextPrompt += `Mensagem: ${message}\n\n`
  contextPrompt += `Responda de forma cordial, objetiva e profissional. Seja útil e humanizado.`

  // Instrução de sistema
  const systemInstruction = `Você é um assistente virtual de atendimento.
Seja cordial, profissional e objetivo.
Use emojis quando apropriado.
Sempre ofereça ajuda adicional ao final.
Não invente informações que você não tem.`

  // Gerar resposta
  const response = await generateAIResponse(contextPrompt, unitId, systemInstruction)

  return response.text
}

/**
 * Busca uso de IA de um tenant no mês atual
 */
export async function getMonthlyAIUsage(unitId: string) {
  const supabase = createClient()

  const monthYear = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
    .replace('/', '-') // Formato: MM-YYYY

  const { data, error } = await supabase
    .from('ai_usage_metrics')
    .select('*')
    .eq('unit_id', unitId)
    .eq('month_year', monthYear)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado (ok)
    console.error('❌ Erro ao buscar uso de IA:', error)
    throw error
  }

  return data || {
    input_tokens: 0,
    output_tokens: 0,
    messages_count: 0,
    estimated_cost_usd: 0
  }
}

/**
 * Pausa/despausa IA para um tenant
 * (Cliente pode pausar temporariamente)
 */
export async function toggleAIPause(unitId: string, paused: boolean): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('units')
    .update({ ai_paused: paused })
    .eq('id', unitId)

  if (error) {
    console.error('❌ Erro ao pausar/despausar IA:', error)
    throw error
  }

  console.log(`✅ IA ${paused ? 'pausada' : 'ativada'} para unit: ${unitId}`)
}
