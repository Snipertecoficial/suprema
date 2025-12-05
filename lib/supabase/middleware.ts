import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const pathname = request.nextUrl.pathname

    // =====================================================
    // 1. ROTAS PÚBLICAS (Não requerem autenticação)
    // =====================================================
    const publicPaths = [
        '/login',
        '/auth',
        '/agendamento',  // Booking público para clientes finais
        '/signup',
        '/pricing',
        '/maintenance',
    ]

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // Se é rota pública, permitir acesso direto
    if (isPublicPath) {
        return response
    }

    // =====================================================
    // 2. VERIFICAR AUTENTICAÇÃO
    // =====================================================
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Não autenticado -> Login
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // =====================================================
    // 3. BUSCAR PERFIL DO USUÁRIO
    // =====================================================
    const { data: profile } = await supabase
        .from('profiles')
        .select('unit_id, role, is_super_admin')
        .eq('id', user.id)
        .single()

    const isSuperAdmin = profile?.is_super_admin === true
    const isAdminRoute = pathname.startsWith('/admin')

    // =====================================================
    // 4. LÓGICA DE SUPER ADMIN (ESTRITA)
    // =====================================================

    if (isSuperAdmin) {
        // Super Admin tentando acessar área de cliente -> Redirecionar para /admin
        if (!isAdminRoute && pathname !== '/admin') {
            // Permitir API routes e assets
            if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
                return response
            }
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
        // Super Admin acessando /admin -> OK
        return response
    }

    // =====================================================
    // 5. LÓGICA DE CLIENTE (BLOQUEIO ADMIN)
    // =====================================================

    // Cliente tentando acessar /admin -> BLOQUEADO
    if (isAdminRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // =====================================================
    // 6. VERIFICAR MODO MANUTENÇÃO
    // =====================================================
    const { data: systemSettings } = await supabase
        .from('system_settings')
        .select('maintenance_mode')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()

    if (systemSettings?.maintenance_mode && !pathname.startsWith('/maintenance')) {
        const url = request.nextUrl.clone()
        url.pathname = '/maintenance'
        return NextResponse.redirect(url)
    }

    // =====================================================
    // 7. VERIFICAR UNIT_ID (Conta configurada?)
    // =====================================================
    if (!profile?.unit_id) {
        if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/billing')) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }
        return response
    }

    // =====================================================
    // 8. VERIFICAR ASSINATURA (PORTEIRO)
    // =====================================================
    const skipSubscriptionPaths = ['/billing', '/logout', '/onboarding']
    const shouldSkipSubscription = skipSubscriptionPaths.some(p => pathname.startsWith(p))

    if (!shouldSkipSubscription) {
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status, current_period_end')
            .eq('unit_id', profile.unit_id)
            .single()

        // Sem assinatura -> Billing
        if (!subscription) {
            const url = request.nextUrl.clone()
            url.pathname = '/billing/subscribe'
            return NextResponse.redirect(url)
        }

        // Assinatura inválida -> Reativar
        const validStatuses = ['active', 'trialing']
        if (!validStatuses.includes(subscription.status)) {
            if (!pathname.startsWith('/billing/reactivate')) {
                const url = request.nextUrl.clone()
                url.pathname = '/billing/reactivate'
                url.searchParams.set('status', subscription.status)
                return NextResponse.redirect(url)
            }
        }

        // Headers de aviso de expiração
        const daysUntilExpiration = Math.ceil(
            (new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntilExpiration <= 7 && daysUntilExpiration > 0) {
            response.headers.set('X-Subscription-Expiring-Soon', 'true')
            response.headers.set('X-Days-Until-Expiration', daysUntilExpiration.toString())
        }
    }

    return response
}
