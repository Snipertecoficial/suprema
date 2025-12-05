'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, AlertCircle, Loader2, User, UserCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface Message {
    id: string
    content: string
    sender_type: 'user' | 'contact' | 'system' | 'bot'
    created_at: string
    delivery_status: string
    unit_id: string
    conversation_id: string
}

interface ChatWindowProps {
    unitId: string | null
    conversationId: string | null
}

export function ChatWindow({ unitId, conversationId }: ChatWindowProps) {
    const supabase = createClient()
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load Messages
    useEffect(() => {
        if (!unitId || !conversationId) return

        async function loadMessages() {
            setLoading(true)
            setError(null)
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('unit_id', unitId)
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true })

                if (error) {
                    console.error('Erro detalhado ao carregar mensagens:', {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint
                    })
                    throw error
                }

                setMessages(data as Message[] || [])
            } catch (err: any) {
                console.error('Erro no loadMessages:', err)
                setError('Erro ao sincronizar mensagens. Tente recarregar a página.')
            } finally {
                setLoading(false)
            }
        }

        loadMessages()

        // Realtime Subscription
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload: RealtimePostgresChangesPayload<Message>) => {
                    const newMsg = payload.new as Message
                    setMessages((prev) => [...prev, newMsg])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [unitId, conversationId, supabase])

    // Send Message
    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault()
        if (!newMessage.trim() || !unitId || !conversationId) return

        setSending(true)
        try {
            const { error } = await supabase.from('messages').insert({
                unit_id: unitId,
                conversation_id: conversationId,
                content: newMessage,
                sender_type: 'user',
                delivery_status: 'pending'
            })

            if (error) throw error

            setNewMessage('')
        } catch (err: any) {
            console.error('Erro ao enviar mensagem:', err)
            alert('Falha ao enviar mensagem. Tente novamente.')
        } finally {
            setSending(false)
        }
    }

    // 1. Estado Inicial: Nenhuma conversa selecionada
    if (!unitId || !conversationId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
                <MessageSquareIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Selecione uma conversa</p>
                <p className="text-sm">Escolha um contato à esquerda para iniciar o atendimento</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header (Opcional, pode ser passado via props se necessário) */}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-500">
                        <AlertCircle className="w-10 h-10 mb-2" />
                        <p>{error}</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>Nenhuma mensagem ainda.</p>
                        <p className="text-sm">Envie a primeira mensagem para iniciar.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isUser = msg.sender_type === 'user'
                        return (
                            <div
                                key={msg.id}
                                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`
                                        max-w-[70%] rounded-lg p-3 shadow-sm relative group
                                        ${isUser
                                            ? 'bg-green-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                        }
                                    `}
                                >
                                    {!isUser && (
                                        <div className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                                            <UserCircle className="w-3 h-3" />
                                            Contato
                                        </div>
                                    )}

                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </p>

                                    <div className={`
                                        text-[10px] mt-1 flex items-center justify-end gap-1
                                        ${isUser ? 'text-green-100' : 'text-gray-400'}
                                    `}>
                                        {format(new Date(msg.created_at), 'HH:mm')}
                                        {isUser && (
                                            <span>
                                                {msg.delivery_status === 'read' ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={sending || loading}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

function MessageSquareIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    )
}
