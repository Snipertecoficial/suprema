import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Inicializa cliente com Service Role (Admin)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: Request) {
    try {
        const { email, password, fullName, unitId } = await request.json()

        // 1. Criar usuário no Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Confirma automaticamente
            user_metadata: { full_name: fullName }
        })

        if (authError) throw authError

        if (!authData.user) throw new Error('Erro ao criar usuário')

        // 2. Criar/Atualizar perfil na tabela profiles
        // Nota: O trigger handle_new_user pode já ter criado, então usamos upsert
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                full_name: fullName,
                role: 'professional',
                unit_id: unitId
            })

        if (profileError) throw profileError

        return NextResponse.json({ success: true, user: authData.user })

    } catch (error: any) {
        console.error('Erro ao criar profissional:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
