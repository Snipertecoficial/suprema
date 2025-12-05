/**
 * =====================================================
 * SYSTEM SETTINGS SERVICE
 * =====================================================
 * Gerencia configurações globais do sistema (Super Admin)
 * Inclui cache in-memory para evitar consultas excessivas
 */

import { createClient } from '@/lib/supabase/server'

// Interface para System Settings
export interface SystemSettings {
  id: string
  gemini_api_key_master: string | null
  openai_api_key_master: string | null
  evolution_api_global_token: string | null
  maintenance_mode: boolean
  maintenance_message: string
  evolution_api_base_url: string
  n8n_base_url: string | null
  max_tokens_per_request: number
  ai_model_name: string
  created_at: string
  updated_at: string
}

// Cache in-memory
let cachedSettings: SystemSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutos

/**
 * Busca configurações globais do sistema
 * Usa cache para evitar consultas frequentes ao banco
 */
export async function getGlobalSettings(): Promise<SystemSettings> {
  // Verificar cache
  const now = Date.now()
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cachedSettings
  }

  // Buscar do banco
  const supabase = createClient()

  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (error) {
    console.error('❌ Erro ao buscar system_settings:', error)
    throw new Error('Não foi possível carregar configurações do sistema')
  }

  if (!data) {
    throw new Error('System settings não encontrado. Execute o SQL de migração.')
  }

  // Atualizar cache
  cachedSettings = data as SystemSettings
  cacheTimestamp = now

  return cachedSettings
}

/**
 * Busca apenas a API Key do Gemini (master)
 * Throws error se não estiver configurada
 */
export async function getGeminiMasterKey(): Promise<string> {
  const settings = await getGlobalSettings()

  if (!settings.gemini_api_key_master) {
    throw new Error('Gemini API Key Master não configurada. Configure no Dashboard Super Admin.')
  }

  return settings.gemini_api_key_master
}

/**
 * Busca apenas o token global da Evolution API
 */
export async function getEvolutionGlobalToken(): Promise<string> {
  const settings = await getGlobalSettings()

  if (!settings.evolution_api_global_token) {
    throw new Error('Evolution API Global Token não configurado. Configure no Dashboard Super Admin.')
  }

  return settings.evolution_api_global_token
}

/**
 * Busca URL base da Evolution API
 */
export async function getEvolutionBaseURL(): Promise<string> {
  const settings = await getGlobalSettings()
  return settings.evolution_api_base_url || 'https://evolution.aion3.com.br'
}

/**
 * Verifica se o sistema está em modo manutenção
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const settings = await getGlobalSettings()
  return settings.maintenance_mode
}

/**
 * Invalida o cache (forçar reload na próxima chamada)
 * Útil quando Super Admin atualiza configurações
 */
export function invalidateSettingsCache(): void {
  cachedSettings = null
  cacheTimestamp = 0
  console.log('✅ Cache de system_settings invalidado')
}

/**
 * Atualiza configurações (apenas Super Admin via API Route)
 * NÃO usar diretamente - apenas via API Route protegida
 */
export async function updateGlobalSettings(updates: Partial<SystemSettings>): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('system_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')

  if (error) {
    console.error('❌ Erro ao atualizar system_settings:', error)
    throw new Error('Não foi possível atualizar configurações')
  }

  // Invalidar cache
  invalidateSettingsCache()

  console.log('✅ System settings atualizadas')
}
