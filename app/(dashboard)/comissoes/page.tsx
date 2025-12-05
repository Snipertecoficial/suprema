'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Trophy, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Professional = {
    id: string
    full_name: string
}

type CommissionData = {
    professional_id: string
    professional_name: string
    total_services: number
    total_commission: number
    net_commission: number
    transaction_count: number
}

export default function ComissoesPage() {
    const { profile } = useAuth()
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [commissionsData, setCommissionsData] = useState<CommissionData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.unit_id) {
            fetchProfessionals()
        }
    }, [profile?.unit_id])

    useEffect(() => {
        if (profile?.unit_id) {
            fetchCommissions()
        }
    }, [profile?.unit_id, selectedMonth])

    const fetchProfessionals = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('unit_id', profile?.unit_id)
            .eq('role', 'professional')

        if (data) setProfessionals(data)
    }

    const fetchCommissions = async () => {
        setLoading(true)
        try {
            const monthDate = new Date(selectedMonth + '-01')
            const startDate = startOfMonth(monthDate).toISOString()
            const endDate = endOfMonth(monthDate).toISOString()

            const { data: transactions } = await supabase
                .from('transactions')
                .select('*, profiles!transactions_professional_id_fkey(full_name)')
                .eq('unit_id', profile?.unit_id)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .eq('payment_status', 'confirmed')

            // Agrupar por profissional
            const grouped = new Map<string, CommissionData>()

            transactions?.forEach((tx: any) => {
                const profId = tx.professional_id
                if (!profId) return

                if (!grouped.has(profId)) {
                    grouped.set(profId, {
                        professional_id: profId,
                        professional_name: tx.profiles?.full_name || 'Desconhecido',
                        total_services: 0,
                        total_commission: 0,
                        net_commission: 0,
                        transaction_count: 0
                    })
                }

                const current = grouped.get(profId)!
                current.total_services += tx.gross_amount || 0
                current.total_commission += tx.professional_amount || 0
                current.net_commission += tx.professional_amount || 0
                current.transaction_count += 1
            })

            const result = Array.from(grouped.values())
                .sort((a, b) => b.net_commission - a.net_commission)

            setCommissionsData(result)
        } catch (error) {
            console.error('Erro ao buscar comissões:', error)
        } finally {
            setLoading(false)
        }
    }

    const totalCommissions = commissionsData.reduce((sum, data) => sum + data.net_commission, 0)

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Comissões</h1>
                    <p className="text-gray-500">Relatório de comissões por profissional</p>
                </div>

                <div className="flex items-center gap-4">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => {
                                const date = new Date()
                                date.setMonth(date.getMonth() - i)
                                const value = format(date, 'yyyy-MM')
                                const label = format(date, 'MMMM yyyy', { locale: ptBR })
                                return (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Card de Resumo */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <DollarSign size={24} />
                        Total de Comissões do Mês
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-green-700">
                        R$ {totalCommissions.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                        {commissionsData.length} profissionais • {commissionsData.reduce((sum, d) => sum + d.transaction_count, 0)} transações
                    </p>
                </CardContent>
            </Card>

            {/* Lista de Profissionais */}
            {loading ? (
                <div className="text-center py-12">Carregando...</div>
            ) : commissionsData.length === 0 ? (
                <Card className="p-12 text-center">
                    <Calendar size={48} className="mx-auto opacity-50 text-gray-400" />
                    <p className="text-lg font-medium text-gray-500 mt-4">Nenhuma comissão registrada neste mês</p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {commissionsData.map((data, index) => (
                        <Card key={data.professional_id} className="hover:shadow-lg transition-shadow relative overflow-hidden">
                            {index === 0 && (
                                <div className="absolute top-2 right-2">
                                    <Trophy className="text-yellow-500" size={24} />
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span>{data.professional_name}</span>
                                    <Badge variant="outline">#{index + 1}</Badge>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Faturamento</span>
                                    <span className="font-semibold">R$ {data.total_services.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Comissão Bruta</span>
                                    <span className="font-semibold">R$ {data.total_commission.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-sm font-medium text-green-700">Comissão Líquida</span>
                                    <span className="font-bold text-green-700 text-lg">
                                        R$ {data.net_commission.toFixed(2)}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-500 text-center pt-2">
                                    {data.transaction_count} atendimentos
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
