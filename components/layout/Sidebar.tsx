'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, Calendar, DollarSign, Users, Settings, LogOut, Clock, TrendingUp, Package, Home, Menu, X, MessageCircle, Zap, UserCircle, ChevronDown, ChevronRight, CreditCard, Scissors } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useTenant } from '@/components/providers/TenantProvider'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useAuth()
    const theme = useTheme()
    const { isPlatformAdmin, isImpersonating, stopImpersonation, tenant } = useTenant()
    const [isOpen, setIsOpen] = useState(false)
    const [configExpanded, setConfigExpanded] = useState(pathname.startsWith('/configuracoes'))

    const menuItems = [
        { href: '/', icon: Home, label: 'Início', color: 'text-gray-600' },
        { href: '/chat', icon: MessageSquare, label: 'Conversas', color: 'text-blue-600' },
        { href: '/agenda', icon: Calendar, label: 'Agenda', color: 'text-purple-600' },
        { href: '/clientes', icon: UserCircle, label: 'Clientes', color: 'text-pink-600' },
        { href: '/servicos', icon: Scissors, label: 'Serviços', color: 'text-violet-600' },
        { href: '/professionals', icon: Users, label: 'Equipe', color: 'text-indigo-600' },
        { href: '/agendamento-config', icon: Calendar, label: 'Agendamento Online', color: 'text-purple-600' },
        { href: '/whatsapp-connection', icon: MessageCircle, label: 'Conexão WhatsApp', color: 'text-green-500' },
        { href: '/automacao-n8n', icon: Zap, label: 'Workflows n8n', color: 'text-purple-600', platformOnly: true },
        { href: '/automacao', icon: Zap, label: 'Automação IA', color: 'text-yellow-600', platformOnly: true },
        { href: '/financeiro', icon: DollarSign, label: 'Financeiro', color: 'text-green-600' },
        { href: '/financeiro/formas-pagamento', icon: CreditCard, label: 'Formas de Pagamento', color: 'text-green-600' },
        { href: '/comissoes', icon: TrendingUp, label: 'Comissões', color: 'text-emerald-600' },
        { href: '/estoque', icon: Package, label: 'Estoque', color: 'text-orange-600' },
        { href: '/clientes-atrasados', icon: Clock, label: 'Clientes Atrasados', color: 'text-red-600' },
    ]

    // Filter menu items based on platform access
    const visibleMenuItems = menuItems.filter(item => {
        if (item.platformOnly && !isPlatformAdmin) return false
        return true
    })

    const configItems = [
        { href: '/configuracoes', icon: Settings, label: 'Geral', color: 'text-gray-600' },
    ]

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-screen border-r border-gray-200 z-40
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:w-64 w-64
                `}
                style={{ backgroundColor: theme.sidebar_bg_color }}
            >
                <div className="flex flex-col h-full">
                    {/* Impersonation Banner */}
                    {isImpersonating && (
                        <div className="bg-amber-500 text-amber-900 px-4 py-2">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-medium">
                                    Visualizando: {tenant?.name}
                                </div>
                                <button
                                    onClick={stopImpersonation}
                                    className="flex items-center gap-1 text-xs font-bold hover:underline"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Voltar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Logo */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            {theme.logo_url ? (
                                <div className="w-10 h-10 relative rounded-lg overflow-hidden">
                                    <Image
                                        src={theme.logo_url}
                                        alt={theme.brand_name || 'Logo'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.accent_color})`
                                    }}
                                >
                                    <span className="text-white font-bold text-xl">
                                        {theme.brand_name?.charAt(0) || 'B'}
                                    </span>
                                </div>
                            )}
                            <div>
                                <h1 className="font-bold text-lg text-gray-900">{theme.brand_name}</h1>
                                <p className="text-xs text-gray-500">CRM Profissional</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-1">
                            {visibleMenuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                                                ${isActive
                                                    ? 'font-medium shadow-sm'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                }
                                            `}
                                            style={isActive ? {
                                                background: `linear-gradient(90deg, ${theme.primary_color}15, ${theme.accent_color}15)`,
                                                color: theme.primary_color
                                            } : {}}
                                        >
                                            <Icon
                                                className={`w-5 h-5 ${isActive ? '' : 'text-gray-400'}`}
                                                style={isActive ? { color: theme.primary_color } : {}}
                                            />
                                            <span className="text-sm">{item.label}</span>
                                        </Link>
                                    </li>
                                )
                            })}

                            {/* Configurações - Expansível */}
                            <li>
                                <button
                                    onClick={() => setConfigExpanded(!configExpanded)}
                                    className={`
                                        flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all
                                        ${pathname.startsWith('/configuracoes')
                                            ? 'font-medium shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                    style={pathname.startsWith('/configuracoes') ? {
                                        background: `linear-gradient(90deg, ${theme.primary_color}15, ${theme.accent_color}15)`,
                                        color: theme.primary_color
                                    } : {}}
                                >
                                    <div className="flex items-center gap-3">
                                        <Settings
                                            className={`w-5 h-5 ${pathname.startsWith('/configuracoes') ? '' : 'text-gray-400'}`}
                                            style={pathname.startsWith('/configuracoes') ? { color: theme.primary_color } : {}}
                                        />
                                        <span className="text-sm">Configurações</span>
                                    </div>
                                    {configExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>

                                {/* Submenu de Configurações */}
                                {configExpanded && (
                                    <ul className="mt-1 ml-4 space-y-1">
                                        <li>
                                            <Link
                                                href="/configuracoes"
                                                onClick={() => setIsOpen(false)}
                                                className={`
                                                    flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm
                                                    ${pathname === '/configuracoes'
                                                        ? 'font-medium'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }
                                                `}
                                                style={pathname === '/configuracoes' ? {
                                                    backgroundColor: `${theme.primary_color}20`,
                                                    color: theme.primary_color
                                                } : {}}
                                            >
                                                <Settings
                                                    className={`w-4 h-4 ${pathname === '/configuracoes' ? '' : 'text-gray-400'}`}
                                                    style={pathname === '/configuracoes' ? { color: theme.primary_color } : {}}
                                                />
                                                <span>Geral</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/configuracoes/personalizacao"
                                                onClick={() => setIsOpen(false)}
                                                className={`
                                                    flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm
                                                    ${pathname === '/configuracoes/personalizacao'
                                                        ? 'font-medium'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }
                                                `}
                                                style={pathname === '/configuracoes/personalizacao' ? {
                                                    backgroundColor: `${theme.primary_color}20`,
                                                    color: theme.primary_color
                                                } : {}}
                                            >
                                                <Settings
                                                    className={`w-4 h-4 ${pathname === '/configuracoes/personalizacao' ? '' : 'text-gray-400'}`}
                                                    style={pathname === '/configuracoes/personalizacao' ? { color: theme.primary_color } : {}}
                                                />
                                                <span>Personalização</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/setup-database"
                                                onClick={() => setIsOpen(false)}
                                                className={`
                                                    flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm
                                                    ${pathname === '/setup-database'
                                                        ? 'font-medium'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }
                                                `}
                                                style={pathname === '/setup-database' ? {
                                                    backgroundColor: `${theme.primary_color}20`,
                                                    color: theme.primary_color
                                                } : {}}
                                            >
                                                <Settings
                                                    className={`w-4 h-4 ${pathname === '/setup-database' ? '' : 'text-gray-400'}`}
                                                    style={pathname === '/setup-database' ? { color: theme.primary_color } : {}}
                                                />
                                                <span>Setup Banco</span>
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        </ul>
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Sair</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
