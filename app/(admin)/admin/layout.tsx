'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Building2, Settings, LogOut, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        checkSuperAdmin()
    }, [])

    async function checkSuperAdmin() {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*, unit:units(name)')
                .eq('id', user.id)
                .single()

            if (error || !profileData || !profileData.is_super_admin) {
                router.push('/')
                return
            }

            setProfile(profileData)
            setLoading(false)
        } catch (error) {
            console.error('Error checking super admin:', error)
            router.push('/login')
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black">
                <div className="text-white">Verificando permissões...</div>
            </div>
        )
    }

    const menuItems = [
        { href: '/admin', icon: LayoutDashboard, label: 'Visão Geral' },
        { href: '/admin/tenants', icon: Building2, label: 'Clientes' },
        { href: '/admin/team', icon: Users, label: 'Equipe' },
        { href: '/admin/settings', icon: Settings, label: 'Configurações' },
    ]

    return (
        <div className="h-screen flex bg-black">
            {/* Sidebar */}
            <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                <div className="p-6 border-b border-zinc-800">
                    <h1 className="text-xl font-bold text-white">Super Admin</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {profile?.unit?.name || 'Sistema'}
                    </p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sair</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-zinc-950">
                <div className="p-8">{children}</div>
            </div>
        </div>
    )
}
