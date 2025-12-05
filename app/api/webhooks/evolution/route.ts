import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client com service role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Webhook Handler para Evolution API
 * Recebe eventos do WhatsApp e processa automaticamente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // console.log('📥 Webhook Evolution recebido:', JSON.stringify(body, null, 2))
    // Log menos verboso
    console.log(`📥 Webhook: ${body.event} | Instância: ${body.instance}`)

    const { event, instance, data } = body

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'messages.upsert':
        await handleMessageUpsert(data, instance)
        break

      case 'messages.update':
        await handleMessageUpdate(data)
        break

      case 'connection.update':
        await handleConnectionUpdate(data, instance)
        break

      case 'qrcode.updated':
        await handleQRCodeUpdate(data, instance)
        break

      default:
        console.log(`⚠️ Evento não tratado: ${event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

/**
 * Helper: Buscar ID da unidade pelo nome da instância
 */
async function getUnitIdByInstanceName(instanceName: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('units')
      .select('id')
      .eq('whatsapp_instance_name', instanceName)
      .single()

    return data?.id || null
  } catch (error) {
    console.error(`❌ Erro ao buscar unidade para instância ${instanceName}:`, error)
    return null
  }
}

/**
 * Processar nova mensagem recebida
 */
async function handleMessageUpsert(data: any, instance: string) {
  try {
    const message = data.message || data
    const key = message.key
    const messageContent = message.message

    // Ignorar mensagens enviadas por nós
    if (key.fromMe) {
      // console.log('📤 Mensagem enviada por nós, ignorando')
      return
    }

    // Extrair informações
    const phoneNumber = key.remoteJid.replace('@s.whatsapp.net', '')
    const messageText = extractMessageText(messageContent)
    const messageType = getMessageType(messageContent)
    const timestamp = message.messageTimestamp
      ? new Date(message.messageTimestamp * 1000).toISOString()
      : new Date().toISOString()

    console.log(`💬 Nova mensagem de ${phoneNumber} na instância ${instance}: ${messageText}`)

    // Buscar ou criar cliente (passando a instância para identificar a unidade)
    const client = await findOrCreateClient(phoneNumber, instance, message.pushName)

    if (!client) {
      console.error(`❌ Cliente não encontrado/criado para ${phoneNumber} na instância ${instance}`)
      return
    }

    // Salvar mensagem no banco
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        unit_id: client.unit_id,
        client_id: client.id,
        phone: phoneNumber,
        sender: 'client',
        message_type: messageType,
        message: messageText,
        media_url: extractMediaUrl(messageContent),
        status: 'received',
        timestamp: timestamp,
        whatsapp_message_id: key.id,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error)
      return
    }

    console.log('✅ Mensagem salva no banco:', conversation.id)

    // Verificar se deve processar com IA
    const shouldProcessWithAI = await checkIfShouldProcessWithAI(client.unit_id)

    if (shouldProcessWithAI) {
      console.log('🤖 Enviando para processamento com IA...')
      await triggerAIProcessing(conversation)
    } else {
      console.log('⏸️ IA pausada para esta unidade, aguardando resposta manual')
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error)
  }
}

/**
 * Atualizar status de mensagem (lida, entregue, etc)
 */
async function handleMessageUpdate(data: any) {
  try {
    const key = data.key || data[0]?.key
    if (!key) return

    const status = data.status || data[0]?.update?.status

    // Atualizar no banco
    await supabase
      .from('conversations')
      .update({
        status: status,
        is_read: status === 'read'
      })
      .eq('whatsapp_message_id', key.id)

    console.log(`✅ Status atualizado para: ${status}`)
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error)
  }
}

/**
 * Atualizar status de conexão da instância
 */
async function handleConnectionUpdate(data: any, instance: string) {
  try {
    const state = data.state || data.connection

    console.log(`📱 Conexão atualizada para ${instance}: ${state}`)

    // Buscar unit_id
    const unitId = await getUnitIdByInstanceName(instance)

    // Salvar estado no banco
    await supabase
      .from('whatsapp_instances')
      .upsert({
        instance_name: instance,
        unit_id: unitId, // Vincular à unidade
        status: state,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'instance_name'
      })

    // Se conectou, atualizar tabela units também
    if (state === 'open' && unitId) {
      await supabase
        .from('units')
        .update({ whatsapp_connected: true })
        .eq('id', unitId)
    } else if (state === 'close' && unitId) {
      await supabase
        .from('units')
        .update({ whatsapp_connected: false })
        .eq('id', unitId)
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar conexão:', error)
  }
}

/**
 * Processar novo QR Code
 */
async function handleQRCodeUpdate(data: any, instance: string) {
  try {
    const qrcode = data.qrcode

    console.log(`📷 Novo QR Code gerado para instância: ${instance}`)

    // Buscar unit_id
    const unitId = await getUnitIdByInstanceName(instance)

    // Salvar QR Code no banco
    await supabase
      .from('whatsapp_instances')
      .upsert({
        instance_name: instance,
        unit_id: unitId, // Vincular à unidade
        qrcode: qrcode,
        status: 'connecting',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'instance_name'
      })

  } catch (error) {
    console.error('❌ Erro ao processar QR Code:', error)
  }
}

/**
 * Buscar ou criar cliente baseado no telefone e instância
 */
async function findOrCreateClient(phoneNumber: string, instanceName: string, pushName?: string) {
  try {
    // 1. Identificar a Unidade pela Instância
    const unitId = await getUnitIdByInstanceName(instanceName)

    if (!unitId) {
      console.error(`❌ Unidade não encontrada para instância: ${instanceName}`)
      return null
    }

    // 2. Buscar cliente existente NAQUELA UNIDADE
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('unit_id', unitId) // Importante: Filtrar por unidade!
      .single()

    if (existingClient) {
      return existingClient
    }

    // 3. Criar novo cliente
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        unit_id: unitId,
        full_name: pushName || `Cliente ${phoneNumber}`,
        phone: phoneNumber,
        client_segment: 'new',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar cliente:', error)
      return null
    }

    console.log('✅ Novo cliente criado:', newClient.id)
    return newClient

  } catch (error) {
    console.error('❌ Erro ao buscar/criar cliente:', error)
    return null
  }
}

/**
 * Extrair texto da mensagem
 */
function extractMessageText(messageContent: any): string {
  if (messageContent.conversation) {
    return messageContent.conversation
  }
  if (messageContent.extendedTextMessage?.text) {
    return messageContent.extendedTextMessage.text
  }
  if (messageContent.imageMessage?.caption) {
    return messageContent.imageMessage.caption
  }
  if (messageContent.videoMessage?.caption) {
    return messageContent.videoMessage.caption
  }
  if (messageContent.documentMessage?.caption) {
    return messageContent.documentMessage.caption
  }
  return '[Mensagem de mídia]'
}

/**
 * Determinar tipo de mensagem
 */
function getMessageType(messageContent: any): string {
  if (messageContent.conversation || messageContent.extendedTextMessage) {
    return 'text'
  }
  if (messageContent.imageMessage) {
    return 'image'
  }
  if (messageContent.videoMessage) {
    return 'video'
  }
  if (messageContent.audioMessage) {
    return 'audio'
  }
  if (messageContent.documentMessage) {
    return 'document'
  }
  if (messageContent.stickerMessage) {
    return 'sticker'
  }
  return 'unknown'
}

/**
 * Extrair URL de mídia se houver
 */
function extractMediaUrl(messageContent: any): string | null {
  if (messageContent.imageMessage?.url) {
    return messageContent.imageMessage.url
  }
  if (messageContent.videoMessage?.url) {
    return messageContent.videoMessage.url
  }
  if (messageContent.audioMessage?.url) {
    return messageContent.audioMessage.url
  }
  if (messageContent.documentMessage?.url) {
    return messageContent.documentMessage.url
  }
  return null
}

/**
 * Verificar se deve processar com IA
 */
async function checkIfShouldProcessWithAI(unitId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('units')
      .select('pausa_ia')
      .eq('id', unitId)
      .single()

    return data?.pausa_ia === false
  } catch (error) {
    console.error('❌ Erro ao verificar pausa_ia:', error)
    return false
  }
}

/**
 * Enviar mensagem para processamento com IA (n8n)
 */
async function triggerAIProcessing(conversation: any) {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

    if (!n8nWebhookUrl) {
      console.warn('⚠️ N8N_WEBHOOK_URL não configurada')
      return
    }

    // Enviar para n8n processar
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation_id: conversation.id,
        phone: conversation.phone,
        message: conversation.message,
        client_id: conversation.client_id,
        unit_id: conversation.unit_id
      })
    })

    if (response.ok) {
      console.log('✅ Mensagem enviada para IA com sucesso')
    } else {
      console.error('❌ Erro ao enviar para IA:', await response.text())
    }

  } catch (error) {
    console.error('❌ Erro ao disparar processamento IA:', error)
  }
}

// Permitir GET para verificar se webhook está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook Evolution API ativo',
    timestamp: new Date().toISOString()
  })
}
