// middleware.ts – VERSÃO SIMPLIFICADA, SEM SUPABASE
// A autenticação é feita nos componentes/pages, não no middleware

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // 🟢 ROTAS PÚBLICAS
    const isPublicRoute =
        pathname === '/login' ||
        pathname === '/' ||
        pathname.startsWith('/aion3/login') ||
        pathname.startsWith('/beto-style/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/public') ||
        pathname.startsWith('/embed') ||
        pathname.startsWith('/agendamento') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.match(/\.(.*)$/) !== null

    // Deixa tudo passar - autenticação é feita no AuthProvider
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
