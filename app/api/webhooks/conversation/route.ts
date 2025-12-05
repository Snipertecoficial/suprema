import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const { remote_jid, action, tags, is_paused } = await request.json()

        if (!remote_jid) {
            return NextResponse.json({ error: 'remote_jid é obrigatório' }, { status: 400 })
        }

        // Busca conversa
        const { data: conversation } = await supabaseAdmin
            .from('conversations')
            .select('*')
            .eq('remote_jid', remote_jid)
            .single()

        if (!conversation) {
            return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
        }

        // Atualiza conversa
        const updates: any = {}

        if (action === 'add_tag' && tags) {
            const currentTags = conversation.tags || []
            const newTags = Array.isArray(tags) ? tags : [tags]
            updates.tags = [...new Set([...currentTags, ...newTags])]
        }

        if (action === 'remove_tag' && tags) {
            const currentTags = conversation.tags || []
            const tagsToRemove = Array.isArray(tags) ? tags : [tags]
            updates.tags = currentTags.filter((t: string) => !tagsToRemove.includes(t))
        }

        if (typeof is_paused === 'boolean') {
            updates.is_paused = is_paused
        }

        updates.updated_at = new Date().toISOString()

        const { error } = await supabaseAdmin
            .from('conversations')
            .update(updates)
            .eq('id', conversation.id)

        if (error) throw error

        return NextResponse.json({ success: true, updates })

    } catch (error: any) {
        console.error('Erro no webhook:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
