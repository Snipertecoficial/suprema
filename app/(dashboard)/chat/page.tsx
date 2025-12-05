'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'

export default function ChatPage() {
    const { profile } = useAuth()
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

    return (
        <div className="flex h-full">
            <div className="w-80 border-r border-gray-200 bg-white h-full overflow-hidden">
                <ChatSidebar
                    unitId={profile?.unit_id || null}
                    onSelectConversation={setSelectedConversationId}
                    selectedId={selectedConversationId}
                />
            </div>
            <div className="flex-1 h-full bg-[#efeae2]">
                <ChatWindow
                    unitId={profile?.unit_id || null}
                    conversationId={selectedConversationId}
                />
            </div>
        </div>
    )
}
