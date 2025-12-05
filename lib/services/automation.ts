import { supabase } from '@/lib/supabase'

export type AutomationEventType =
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_UPDATED'
    | 'APPOINTMENT_CANCELED'
    | 'PAYMENT_CONFIRMED'
    | 'CLIENT_REGISTERED'

interface TriggerPayload {
    [key: string]: any
}

/**
 * Dispara uma automação (Webhook N8N) se estiver configurada e ativa para a unidade.
 * @param unitId ID da unidade (Tenant)
 * @param eventType Tipo do evento (ex: APPOINTMENT_CREATED)
 * @param payload Dados a serem enviados para o N8N
 */
export async function triggerAutomation(
    unitId: string,
    eventType: AutomationEventType,
    payload: TriggerPayload
) {
    try {
        // 1. Buscar configuração de integração ativa
        const { data: config, error } = await supabase
            .from('integrations_config')
            .select('n8n_webhook_url')
            .eq('unit_id', unitId)
            .eq('event_type', eventType)
            .eq('is_active', true)
            .single()

        if (error || !config) {
            // Silenciosamente ignorar se não houver automação configurada
            // console.log(`Nenhuma automação ativa para ${eventType} na unidade ${unitId}`)
            return
        }

        // 2. Disparar Webhook para o N8N
        console.log(`🚀 Disparando automação ${eventType} para ${config.n8n_webhook_url}`)

        // Não aguardar a resposta para não bloquear o fluxo principal (Fire and Forget)
        fetch(config.n8n_webhook_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Unit-ID': unitId,
                'X-Event-Type': eventType
            },
            body: JSON.stringify({
                event: eventType,
                timestamp: new Date().toISOString(),
                data: payload
            })
        }).catch(err => console.error('Erro ao disparar webhook N8N:', err))

    } catch (error) {
        console.error('Erro interno no triggerAutomation:', error)
    }
}
