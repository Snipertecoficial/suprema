'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Users, Calendar, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FinanceiroPage() {
    const { profile } = useAuth()
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCommissions: 0,
        netProfit: 0,
        avgTicket: 0,
        transactionCount: 0,
        topProfessional: '',
        lowStockCount: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.unit_id) {
            fetchStats()
        }
    }, [profile?.unit_id])

    const fetchStats = async () => {
        const startDate = startOfMonth(new Date()).toISOString()
        const endDate = endOfMonth(new Date()).toISOString()

        // Buscar transações do mês
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*, profiles!transactions_professional_id_fkey(full_name)')
            .eq('unit_id', profile?.unit_id)
            .eq('payment_status', 'confirmed')
            .gte('created_at', startDate)
            .lte('created_at', endDate)

        // Calcular estatísticas
        const total = transactions?.reduce((sum, t) => sum + (t.gross_amount || 0), 0) || 0
        const commissions = transactions?.reduce((sum, t) => sum + (t.professional_amount || 0), 0) || 0
        const count = transactions?.length || 0

        // Encontrar top profissional
        const profMap = new Map<string, number>()
        transactions?.forEach(t => {
            const name = t.profiles?.full_name || 'Desconhecido'
            profMap.set(name, (profMap.get(name) || 0) + (t.gross_amount || 0))
        })
        const topProf = Array.from(profMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

        // Produtos com estoque baixo
        const { data: products } = await supabase
            .from('products')
            .select('current_stock, min_stock')
            .eq('unit_id', profile?.unit_id)
            .lte('current_stock', supabase.rpc('min_stock'))

        setStats({
            totalRevenue: total,
            totalCommissions: commissions,
            netProfit: total - commissions,
            avgTicket: count > 0 ? total / count : 0,
            transactionCount: count,
            topProfessional: topProf,
            lowStockCount: products?.length || 0
        })

        setLoading(false)
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
                <p className="text-gray-500">Visão geral do faturamento - {format(new Date(), 'MMMM yyyy', { locale: ptBR })}</p>
            </div>

            {loading ? (
                <div className="text-center py-12">Carregando...</div>
            ) : (
                <>
                    {/* Cards Principais */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-800">Receita Total</CardTitle>
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-700">R$ {stats.totalRevenue.toFixed(2)}</div>
                                <p className="text-xs text-green-600 mt-1">{stats.transactionCount} transações</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-800">Lucro Líquido</CardTitle>
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-700">R$ {stats.netProfit.toFixed(2)}</div>
                                <p className="text-xs text-blue-600 mt-1">Após comissões</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-purple-800">Ticket Médio</CardTitle>
                                <CreditCard className="h-5 w-5 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-700">R$ {stats.avgTicket.toFixed(2)}</div>
                                <p className="text-xs text-purple-600 mt-1">Por atendimento</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-orange-800">Comissões</CardTitle>
                                <TrendingDown className="h-5 w-5 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-orange-700">R$ {stats.totalCommissions.toFixed(2)}</div>
                                <p className="text-xs text-orange-600 mt-1">Total do mês</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cards Secundários */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Top Profissional</CardTitle>
                                <Users className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.topProfessional}</div>
                                <p className="text-xs text-gray-500 mt-1">Maior faturamento</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
                                <Calendar className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.transactionCount}</div>
                                <p className="text-xs text-gray-500 mt-1">Concluídos este mês</p>
                            </CardContent>
                        </Card>

                        <Card className={stats.lowStockCount > 0 ? 'border-red-200 bg-red-50' : ''}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
                                <Package className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-600' : ''}`}>
                                    {stats.lowStockCount}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {stats.lowStockCount > 0 ? 'Produtos abaixo do mínimo' : 'Tudo em dia'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
