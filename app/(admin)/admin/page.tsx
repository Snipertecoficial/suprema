'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    TrendingUp,
    Building2,
    DollarSign,
    Zap,
    Users,
    ArrowUpRight,
    CheckCircle,
    XCircle,
    Plus,
    Settings,
    ExternalLink,
    CreditCard
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

interface Unit {
    id: string
    name: string
    slug: string
    logo_url: string | null
    created_at: string
    is_platform_owner: boolean | null
}

interface Subscription {
    id: string
    unit_id: string
    status: string
    plan_name: string
    price_monthly_brl: number
    created_at: string
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        mrr: 0,
        activeClients: 0,
        totalClients: 0,
        teamMembers: 0,
    })
    const [recentClients, setRecentClients] = useState<(Unit & { subscription?: Subscription })[]>([])
    const [growthData, setGrowthData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    async function loadDashboardData() {
        try {
            // 1. Buscar todas as units (EXCLUINDO a plataforma AION3)
            const { data: units } = await supabase
                .from('units')
                .select('*')
                .or('is_platform_owner.eq.false,is_platform_owner.is.null')
                .order('created_at', { ascending: false })

            // 2. Buscar todas as subscriptions
            const { data: subscriptions } = await supabase
                .from('subscriptions')
                .select('*')
                .order('created_at', { ascending: false })

            // 3. Calcular estatísticas REAIS
            const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || []
            const mrr = activeSubscriptions.reduce((sum, sub) => sum + (sub.price_monthly_brl || 0), 0)
            const activeClientsCount = activeSubscriptions.length
            const totalClientsCount = units?.length || 0

            // 4. Team Members (profiles com is_super_admin = true ou da unit AION3)
            let teamCount = 0
            try {
                const { count } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_super_admin', true)
                teamCount = count || 0
            } catch (e) {
                // Fallback
            }

            // 5. Merge units com subscriptions
            const unitsWithSubs = units?.map(unit => ({
                ...unit,
                subscription: subscriptions?.find(s => s.unit_id === unit.id)
            })) || []

            // 6. Dados de crescimento REAIS baseados nas datas de criação
            const now = new Date()
            const last6Months = []
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')

                // Contar units criadas até esse mês
                const unitsUntilMonth = units?.filter(u => {
                    const createdAt = new Date(u.created_at)
                    return createdAt <= new Date(date.getFullYear(), date.getMonth() + 1, 0)
                }).length || 0

                // Calcular MRR até esse mês (simplificado - usa o valor atual das assinaturas ativas criadas até esse mês)
                const subsUntilMonth = subscriptions?.filter(s => {
                    const createdAt = new Date(s.created_at)
                    return createdAt <= new Date(date.getFullYear(), date.getMonth() + 1, 0) && s.status === 'active'
                }) || []
                const mrrUntilMonth = subsUntilMonth.reduce((sum, sub) => sum + (sub.price_monthly_brl || 0), 0)

                last6Months.push({
                    month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                    clientes: unitsUntilMonth,
                    mrr: mrrUntilMonth
                })
            }

            setStats({
                mrr,
                activeClients: activeClientsCount,
                totalClients: totalClientsCount,
                teamMembers: teamCount,
            })
            setRecentClients(unitsWithSubs.slice(0, 5))
            setGrowthData(last6Months)
            setLoading(false)
        } catch (error) {
            console.error('Error loading dashboard:', error)
            setLoading(false)
        }
    }

    async function handleImpersonate(unitId: string, slug: string) {
        try {
            const response = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitId, unitSlug: slug })
            })
            const data = await response.json()
            if (data.success) {
                window.location.href = '/'
            }
        } catch (error) {
            console.error('Erro no impersonate:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-zinc-400">Carregando dashboard...</div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Dashboard AION3
                    </h1>
                    <p className="text-zinc-500 mt-1">Painel de controle da plataforma</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/tenants"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-all"
                    >
                        <Building2 className="w-4 h-4" />
                        Ver Clientes
                    </Link>
                    <Link
                        href="/admin/tenants/new"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium transition-all shadow-lg shadow-blue-500/25"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Cliente
                    </Link>
                </div>
            </div>

            {/* Ações críticas do Super Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/automacao-n8n"
                    className="border border-purple-500/30 rounded-lg p-4 bg-purple-500/5 hover:bg-purple-500/10 transition"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-purple-400">Automação</p>
                            <h3 className="text-lg font-semibold text-white">Workflows n8n prontos</h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Instale fluxos plug-and-play para Salões, Clínicas, Podologias e Barbearias.
                            </p>
                        </div>
                        <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                </Link>

                <Link
                    href="/billing/reactivate?status=past_due"
                    className="border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/5 hover:bg-emerald-500/10 transition"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-emerald-400">Pagamentos</p>
                            <h3 className="text-lg font-semibold text-white">Stripe / Assinaturas</h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Rota dedicada para testes e reativações enquanto o portal Stripe nativo é finalizado.
                            </p>
                        </div>
                        <CreditCard className="w-6 h-6 text-emerald-400" />
                    </div>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="MRR Atual"
                    value={`R$ ${stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    gradient="from-emerald-500/20 to-emerald-500/5"
                    iconColor="text-emerald-500"
                />
                <StatsCard
                    title="Clientes Ativos"
                    value={stats.activeClients.toString()}
                    icon={CheckCircle}
                    subtitle={`de ${stats.totalClients} total`}
                    gradient="from-blue-500/20 to-blue-500/5"
                    iconColor="text-blue-500"
                />
                <StatsCard
                    title="Total de Clientes"
                    value={stats.totalClients.toString()}
                    icon={Building2}
                    subtitle="cadastrados"
                    gradient="from-purple-500/20 to-purple-500/5"
                    iconColor="text-purple-500"
                />
                <StatsCard
                    title="Equipe AION3"
                    value={stats.teamMembers.toString()}
                    icon={Users}
                    subtitle="super admins"
                    gradient="from-amber-500/20 to-amber-500/5"
                    iconColor="text-amber-500"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart - Takes 2 columns */}
                <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold text-white">Crescimento</h2>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1 text-blue-400">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Clientes
                            </span>
                            <span className="flex items-center gap-1 text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                MRR
                            </span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={growthData}>
                            <defs>
                                <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="month" stroke="#52525b" fontSize={12} />
                            <YAxis stroke="#52525b" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: '1px solid #27272a',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                }}
                                labelStyle={{ color: '#a1a1aa' }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'mrr') return [`R$ ${value.toLocaleString('pt-BR')}`, 'MRR']
                                    return [value, 'Clientes']
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="clientes"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorClientes)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Quick Actions */}
                <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
                    <div className="space-y-3">
                        <QuickAction
                            href="/admin/tenants/new"
                            icon={Plus}
                            title="Novo Cliente"
                            description="Adicionar novo cliente"
                            color="blue"
                        />
                        <QuickAction
                            href="/admin/tenants"
                            icon={Building2}
                            title="Gerenciar Clientes"
                            description="Ver todos os clientes"
                            color="purple"
                        />
                        <QuickAction
                            href="/admin/settings"
                            icon={Settings}
                            title="Configurações"
                            description="API Keys e sistema"
                            color="zinc"
                        />
                    </div>
                </div>
            </div>

            {/* Recent Clients */}
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Clientes Recentes</h2>
                        <p className="text-sm text-zinc-500">Últimos clientes cadastrados</p>
                    </div>
                    <Link
                        href="/admin/tenants"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                        Ver todos <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="divide-y divide-zinc-800">
                    {recentClients.map((client) => (
                        <div key={client.id} className="p-4 hover:bg-zinc-800/30 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                    {client.logo_url ? (
                                        <img src={client.logo_url} alt={client.name} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <Building2 className="w-5 h-5 text-zinc-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-white">{client.name}</p>
                                    <p className="text-sm text-zinc-500">/{client.slug}/login</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-zinc-400">
                                        {client.subscription?.plan_name || 'Sem plano'}
                                        {client.subscription?.price_monthly_brl && (
                                            <span className="text-emerald-400 ml-2">
                                                R$ {client.subscription.price_monthly_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {client.subscription?.status === 'active' ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                <span className="text-xs text-emerald-500">Ativo</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3 h-3 text-red-500" />
                                                <span className="text-xs text-red-500">Inativo</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleImpersonate(client.id, client.slug)}
                                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                    title="Acessar como cliente"
                                >
                                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {recentClients.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">
                            Nenhum cliente cadastrado ainda
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Stats Card Component
function StatsCard({
    title,
    value,
    icon: Icon,
    gradient,
    iconColor,
    subtitle
}: {
    title: string
    value: string
    icon: any
    gradient: string
    iconColor: string
    subtitle?: string
}) {
    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} backdrop-blur border border-zinc-800 rounded-xl p-5`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-zinc-400 text-sm">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-2 rounded-lg bg-zinc-800/50`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            </div>
        </div>
    )
}

// Quick Action Component
function QuickAction({
    href,
    icon: Icon,
    title,
    description,
    color
}: {
    href: string
    icon: any
    title: string
    description: string
    color: string
}) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20',
        zinc: 'bg-zinc-500/10 text-zinc-400 group-hover:bg-zinc-500/20',
    }

    return (
        <Link
            href={href}
            className="group flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-all"
        >
            <div className={`p-2 rounded-lg transition-colors ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="font-medium text-white text-sm">{title}</p>
                <p className="text-xs text-zinc-500">{description}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
    )
}
