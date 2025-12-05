/**
 * Units utility functions
 * Funções para buscar informações de tenants/unidades
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Cria cliente Supabase para Server Components
 */
async function createSupabaseServer() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )
}

/**
 * Busca uma unit pelo slug (aion3, beto-style, etc.)
 */
export async function getUnitBySlug(slug: string) {
    const supabase = await createSupabaseServer()

    // Usar .limit(1) em vez de .single() para evitar erro quando não há resultado
    const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('slug', slug)
        .limit(1)

    if (error) {
        console.error('Erro ao buscar unit por slug:', error.message)
        return null
    }

    // Retorna o primeiro resultado ou null se não encontrar
    return data && data.length > 0 ? data[0] : null
}

/**
 * Busca todas as units ativas (não-plataforma)
 */
export async function getActiveUnits() {
    const supabase = await createSupabaseServer()

    const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('is_platform_owner', false)
        .order('name')

    if (error) {
        console.error('Erro ao buscar units ativas:', error)
        return []
    }

    return data || []
}
