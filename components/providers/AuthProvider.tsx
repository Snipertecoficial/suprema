'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

type Profile = {
    id: string
    full_name: string | null
    role: 'super_admin' | 'admin' | 'professional'
    unit_id: string | null
    is_super_admin?: boolean
}

type AuthContextType = {
    user: User | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
})

// Função para verificar se é rota pública
const isPublicPath = (path: string | null): boolean => {
    if (!path) return false
    const publicPatterns = [
        '/login',
        '/agendamento',
        '/auth',
        '/public',
        '/embed',
        '/maintenance',
        '/setup-database',
    ]
    // Verifica rotas de tenant login (ex: /beto-style/login, /aion3/login)
    if (path.match(/^\/[^\/]+\/login$/)) return true
    return publicPatterns.some(route => path.startsWith(route))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        let mounted = true

        const getUser = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (!mounted) return

                if (error) {
                    console.error('AuthProvider: Session error', error)
                    if (error.message.includes('Refresh Token')) {
                        await supabase.auth.signOut()
                        if (!isPublicPath(pathname)) {
                            router.push('/login')
                        }
                        setLoading(false)
                        return
                    }
                    throw error
                }

                if (session?.user) {
                    setUser(session.user)
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    if (mounted && profileData) {
                        setProfile(profileData as Profile)
                    }
                } else {
                    if (!isPublicPath(pathname) && mounted) {
                        router.push('/login')
                    }
                }
            } catch (e) {
                console.error('AuthProvider: Error', e)
                if (mounted) {
                    await supabase.auth.signOut()
                    if (!isPublicPath(pathname)) {
                        router.push('/login')
                    }
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return

            if (session?.user) {
                setUser(session.user)
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                if (mounted && profileData) {
                    setProfile(profileData as Profile)
                }
            } else {
                setUser(null)
                setProfile(null)
                if (!isPublicPath(pathname) && mounted) {
                    router.push('/login')
                }
            }
            if (mounted) {
                setLoading(false)
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {!loading ? children : <div className="flex h-screen items-center justify-center">Carregando...</div>}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
