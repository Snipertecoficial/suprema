import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Esta rota permite que super admins "impersonem" um tenant
// Ela define um cookie especial que o AuthProvider usa para carregar o contexto do tenant

export async function POST(request: NextRequest) {
    try {
        const { unitId, unitSlug } = await request.json()

        if (!unitId || !unitSlug) {
            return NextResponse.json({ error: 'unitId e unitSlug são obrigatórios' }, { status: 400 })
        }

        // Verificar se o usuário atual é super_admin
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Buscar o unit para confirmar que existe
        const { data: unit, error: unitError } = await supabase
            .from('units')
            .select('id, name, slug')
            .eq('id', unitId)
            .single()

        if (unitError || !unit) {
            return NextResponse.json({ error: 'Unit não encontrada' }, { status: 404 })
        }

        // Definir cookie de impersonation
        const cookieStore = await cookies()

        // Cookie expira em 4 horas
        const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000)

        cookieStore.set('impersonate_unit_id', unitId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/'
        })

        cookieStore.set('impersonate_unit_slug', unitSlug, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/'
        })

        return NextResponse.json({
            success: true,
            message: `Impersonando ${unit.name}`,
            redirectTo: '/'
        })

    } catch (error: any) {
        console.error('Erro no impersonate:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Endpoint para parar de impersonar
export async function DELETE() {
    try {
        const cookieStore = await cookies()

        cookieStore.delete('impersonate_unit_id')
        cookieStore.delete('impersonate_unit_slug')

        return NextResponse.json({
            success: true,
            message: 'Impersonation encerrada',
            redirectTo: '/admin'
        })

    } catch (error: any) {
        console.error('Erro ao encerrar impersonation:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Verificar status de impersonation
export async function GET() {
    try {
        const cookieStore = await cookies()

        const unitId = cookieStore.get('impersonate_unit_id')?.value
        const unitSlug = cookieStore.get('impersonate_unit_slug')?.value

        if (unitId && unitSlug) {
            return NextResponse.json({
                isImpersonating: true,
                unitId,
                unitSlug
            })
        }

        return NextResponse.json({ isImpersonating: false })

    } catch (error: any) {
        return NextResponse.json({ isImpersonating: false })
    }
}
