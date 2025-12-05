'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Interface baseada no novo Schema
interface Conversation {
    id: string
    unit_id: string
    contact_name: string
    contact_phone: string
    contact_avatar_url: string | null
    last_message: string | null
    last_message_at: string | null
    unread_count: number
    tags: string[] | null
    status: string
}

interface ChatSidebarProps {
    unitId: string | null
    onSelectConversation: (id: string) => void
    selectedId: string | null
}

export function ChatSidebar({ unitId, onSelectConversation, selectedId }: ChatSidebarProps) {
    const supabase = createClient()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Som de notificação
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    }, [])

    useEffect(() => {
        if (!unitId) return

        const fetchConversations = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('unit_id', unitId)
                .order('last_message_at', { ascending: false })

            if (error) {
                console.error('Erro ao buscar conversas:', error)
                return
            }

            setConversations(data as Conversation[])
        }

        fetchConversations()

        // Realtime
        const channel = supabase
            .channel('conversations_list')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `unit_id=eq.${unitId}`
                },
                (payload: RealtimePostgresChangesPayload<Conversation>) => {
                    // Tocar som se for nova mensagem não lida
                    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        const newConv = payload.new as Conversation
                        if (newConv.unread_count > 0 && audioRef.current) {
                            audioRef.current.play().catch(() => { })
                        }
                    }
                    fetchConversations()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [unitId, supabase])

    const filteredConversations = conversations.filter(conv =>
        conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.contact_phone.includes(searchTerm)
    )

    const needsAttention = (conv: Conversation) => conv.tags?.includes('atendimento_humano')

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Conversas</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar contato..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Lista */}
            <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        Nenhuma conversa encontrada
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`
                                    w-full p-4 text-left transition-colors border-b border-gray-50
                                    hover:bg-gray-50 focus:outline-none
                                    ${selectedId === conv.id ? 'bg-green-50 border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'}
                                    ${needsAttention(conv) ? 'bg-red-50 border-l-red-500' : ''}
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar>
                                        <AvatarImage src={conv.contact_avatar_url || undefined} />
                                        <AvatarFallback className="bg-green-100 text-green-700">
                                            {conv.contact_name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-900 truncate">
                                                {conv.contact_name}
                                            </span>
                                            {conv.last_message_at && (
                                                <span className="text-xs text-gray-400 shrink-0">
                                                    {format(new Date(conv.last_message_at), 'HH:mm')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm text-gray-500 truncate max-w-[140px]">
                                                {conv.last_message || 'Nova conversa'}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <Badge className="bg-green-500 hover:bg-green-600 h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                                                    {conv.unread_count}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        {conv.tags && conv.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {conv.tags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        variant="outline"
                                                        className={`
                                                            text-[10px] px-1 py-0 h-5
                                                            ${tag === 'atendimento_humano' ? 'border-red-200 text-red-700 bg-red-50' : 'border-gray-200 text-gray-600'}
                                                        `}
                                                    >
                                                        {tag === 'atendimento_humano' && <Bell className="w-3 h-3 mr-1" />}
                                                        {tag.replace('_', ' ')}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
