/**
 * Evolution API Service
 * Serviço completo para integração com Evolution API (WhatsApp)
 * Documentação: https://doc.evolution-api.com
 */

// Tipos
export interface EvolutionInstance {
  instanceName: string
  status: 'open' | 'close' | 'connecting'
  qrcode?: {
    base64: string
    code: string
  }
  phoneNumber?: string
}

export interface SendTextMessageParams {
  number: string
  text: string
}

export interface SendMediaMessageParams {
  number: string
  mediaUrl: string
  caption?: string
  mediaType?: 'image' | 'video' | 'audio' | 'document'
}

export interface SendButtonMessageParams {
  number: string
  text: string
  buttons: Array<{
    id: string
    text: string
  }>
  footer?: string
}

export interface Message {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: any
  messageTimestamp: number
  pushName?: string
  status?: 'pending' | 'sent' | 'received' | 'read' | 'failed'
}

// Configuração
const EVOLUTION_API_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || ''
// INSTANCE_NAME removido - agora é dinâmico por unit (multi-tenant)

// Headers padrão
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_API_KEY
})

// ... (rest of the file remains the same until validateConfig)

/**
 * Validar configuração (verifica se as env vars estão setadas)
 */
export function validateConfig() {
  const errors = []

  if (!EVOLUTION_API_URL) {
    errors.push('NEXT_PUBLIC_EVOLUTION_API_URL não configurada')
  }

  if (!EVOLUTION_API_KEY) {
    errors.push('NEXT_PUBLIC_EVOLUTION_API_KEY não configurada')
  }

  // INSTANCE_NAME não é mais obrigatório pois será dinâmico por cliente
  // if (!INSTANCE_NAME) {
  //   errors.push('EVOLUTION_INSTANCE_NAME não configurada')
  // }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Criar ou conectar uma instância
 * @param instanceName - Nome único da instância (obrigatório para multi-tenant)
 */
export async function connectInstance(instanceName: string) {
  // Validar configuração antes de fazer request
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    throw new Error('Evolution API não configurada. Verifique as variáveis de ambiente.')
  }

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))

      // Detectar se a instância já existe (pode ser 400, 403 ou 409)
      const instanceExists =
        response.status === 400 ||
        response.status === 403 ||
        response.status === 409 ||
        (error.message && error.message.includes('already')) ||
        (error.response?.message?.[0] && error.response.message[0].includes('already in use'))

      if (instanceExists) {
        console.log(`ℹ️ Instância '${instanceName}' já existe. Buscando QR Code...`)

        // Buscar QR Code da instância existente
        try {
          const qrData = await getQRCode(instanceName)
          if (qrData?.qrcode?.base64) {
            return {
              instanceName,
              qrcode: qrData.qrcode,
              status: 'connecting'
            } as EvolutionInstance
          }
        } catch (qrError) {
          console.warn('Não foi possível obter QR Code, verificando status...')
        }

        // Se não conseguiu QR Code, verificar se já está conectada
        const status = await getConnectionStatus(instanceName)
        return {
          instanceName,
          status: status.state,
          ...status.instance
        } as EvolutionInstance
      }

      throw new Error(error.message || error.response?.message?.[0] || 'Erro ao criar instância')
    }

    const data = await response.json()
    return data as EvolutionInstance
  } catch (error) {
    console.error('Erro ao conectar instância:', error)
    throw error
  }
}

/**
 * Obter QR Code para conexão
 * @param instanceName - Nome único da instância (obrigatório)
 */
export async function getQRCode(instanceName: string) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      // API may return 400/403 when instance already has QR or is connected
      console.warn(`⚠️ getQRCode returned ${response.status}, returning empty QR data`)
      return { qrcode: null }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erro ao obter QR Code:', error)
    // Return empty QR data to allow caller to handle gracefully
    return { qrcode: null }
  }
}


/**
 * Verificar status da conexão
 * @param instanceName - Nome único da instância (obrigatório)
 */
export async function getConnectionStatus(instanceName: string) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: getHeaders()
    })

    // Handle 404 - instância não existe ainda (normal para novos clientes)
    if (response.status === 404) {
      console.log(`ℹ️ Instância '${instanceName}' ainda não foi criada`)
      return {
        state: 'close',
        instanceStatus: 'not_found',
        message: 'Instância ainda não conectada. Clique em "Conectar WhatsApp" para começar.',
        instanceName
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error(`⚠️ Evolution API Error [${response.status}]:`, errorData)

      // Retornar estado desconectado ao invés de lançar erro
      return {
        state: 'close',
        instanceStatus: 'error',
        error: errorData.message || `HTTP ${response.status}`,
        instanceName
      }
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    // Erro de rede ou outro erro fatal
    console.error('❌ Erro ao conectar com Evolution API:', error.message)
    return {
      state: 'close',
      instanceStatus: 'error',
      error: 'Não foi possível conectar com o servidor Evolution API',
      details: error.message
    }
  }
}

/**
 * Desconectar instância (logout - mantém instância, apenas desconecta)
 * @param instanceName - Nome único da instância (obrigatório)
 */
export async function disconnectInstance(instanceName: string) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao desconectar')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao desconectar:', error)
    throw error
  }
}

/**
 * Deletar instância completamente (remove do servidor Evolution API)
 * Use isso quando quiser remover completamente a instância e criar uma nova
 * @param instanceName - Nome único da instância (obrigatório)
 */
export async function deleteInstance(instanceName: string) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: getHeaders()
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Erro ao deletar instância')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao deletar instância:', error)
    throw error
  }
}

/**
 * Enviar mensagem de texto
 */
export async function sendTextMessage(
  params: SendTextMessageParams,
  instanceName: string
) {
  try {
    // Formatar número (remover caracteres especiais e adicionar @s.whatsapp.net)
    const formattedNumber = params.number.replace(/\D/g, '') + '@s.whatsapp.net'

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        number: formattedNumber,
        text: params.text
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao enviar mensagem')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    throw error
  }
}

/**
 * Enviar mensagem com mídia (imagem, vídeo, etc)
 */
export async function sendMediaMessage(
  params: SendMediaMessageParams,
  instanceName: string
) {
  try {
    const formattedNumber = params.number.replace(/\D/g, '') + '@s.whatsapp.net'

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        number: formattedNumber,
        mediatype: params.mediaType || 'image',
        media: params.mediaUrl,
        caption: params.caption || ''
      })
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar mídia')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao enviar mídia:', error)
    throw error
  }
}

/**
 * Enviar mensagem com botões
 */
export async function sendButtonMessage(
  params: SendButtonMessageParams,
  instanceName: string
) {
  try {
    const formattedNumber = params.number.replace(/\D/g, '') + '@s.whatsapp.net'

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendButtons/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        number: formattedNumber,
        title: params.text,
        description: params.text,
        footer: params.footer || '',
        buttons: params.buttons.map(btn => ({
          type: 'reply',
          reply: {
            id: btn.id,
            title: btn.text
          }
        }))
      })
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar botões')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao enviar botões:', error)
    throw error
  }
}

/**
 * Marcar mensagem como lida
 */
export async function markAsRead(
  messageKey: any,
  instanceName: string
) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/chat/markMessageAsRead/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        key: messageKey
      })
    })

    if (!response.ok) {
      throw new Error('Erro ao marcar como lida')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao marcar como lida:', error)
    throw error
  }
}

/**
 * Buscar mensagens de um chat
 */
export async function fetchMessages(
  remoteJid: string,
  instanceName: string,
  limit: number = 50
) {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/chat/fetchMessages/${instanceName}?remoteJid=${remoteJid}&limit=${limit}`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar mensagens')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    throw error
  }
}

/**
 * Listar todos os chats
 */
export async function listChats(instanceName: string) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${instanceName}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error('Erro ao listar chats')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao listar chats:', error)
    throw error
  }
}

/**
 * Obter informações de um contato
 */
export async function getContact(
  number: string,
  instanceName: string
) {
  try {
    const formattedNumber = number.replace(/\D/g, '') + '@s.whatsapp.net'

    const response = await fetch(
      `${EVOLUTION_API_URL}/chat/findContact/${instanceName}?number=${formattedNumber}`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar contato')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    throw error
  }
}

/**
 * Configurar webhook para receber mensagens
 */
export async function setWebhook(
  webhookUrl: string,
  instanceName: string
) {
  // Evitar erro 400 ao tentar configurar webhook local em API remota
  if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
    console.warn('⚠️ Webhook não configurado: URL local detectada (' + webhookUrl + ')')
    return { message: 'Webhook local ignorado' }
  }

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: true,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED'
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error(`⚠️ Webhook Config Error [${response.status}]:`, errorData)
      throw new Error(
        errorData.message || `Falha ao configurar webhook (HTTP ${response.status})`
      )
    }

    const data = await response.json()
    console.log('✅ Webhook configurado com sucesso:', instanceName)
    return data
  } catch (error: any) {
    console.error('❌ Erro ao configurar webhook:', error.message)
    // Re-throw com mensagem mais amigável
    throw new Error(
      error.message || 'Não foi possível configurar o webhook. Verifique se a Evolution API está acessível.'
    )
  }
}

/**
 * Verificar se a API está acessível
 */
export async function healthCheck() {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/`, {
      method: 'GET',
      headers: getHeaders()
    })

    return response.ok
  } catch (error) {
    console.error('Evolution API não está acessível:', error)
    return false
  }
}


