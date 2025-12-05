'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTenant } from '@/components/providers/TenantProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  Package,
  Bell
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format, isToday, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { APP_CONSTANTS } from '@/lib/constants'

export default function HomePage() {
  const { profile } = useAuth()
  const { tenant } = useTenant()
  const theme = useTheme()
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingHumanRequests: 0,
    lateClients: 0,
    lowStockProducts: 0,
    todayRevenue: 0,
    nextAppointment: null as any
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.unit_id) {
      fetchDashboardStats()
    }
  }, [profile?.unit_id])

  // ... imports anteriores ...

  const fetchDashboardStats = async () => {
    const today = new Date()
    const startDate = startOfDay(today).toISOString()
    const endDate = endOfDay(today).toISOString()

    try {
      // Executar queries em paralelo para melhor performance
      const [
        appointmentsResult,
        humanRequestsResult,
        cyclesResult,
        productsResult,
        transactionsResult
      ] = await Promise.all([
        // 1. Agendamentos de hoje
        supabase
          .from('appointments')
          .select('*')
          .eq('unit_id', profile?.unit_id)
          .gte('start_time', startDate)
          .lte('start_time', endDate)
          .order('start_time', { ascending: true }),

        // 2. Conversas com pedido de humano
        supabase
          .from('conversations')
          .select('*')
          .eq('unit_id', profile?.unit_id)
          .contains('tags', [APP_CONSTANTS.TAGS.HUMAN_SUPPORT]),

        // 3. Clientes atrasados
        supabase
          .from('service_cycles')
          .select('*')
          .eq('unit_id', profile?.unit_id),

        // 4. Produtos com estoque baixo
        supabase
          .from('products')
          .select('current_stock, min_stock')
          .eq('unit_id', profile?.unit_id),

        // 5. Receita de hoje
        supabase
          .from('transactions')
          .select('gross_amount')
          .eq('unit_id', profile?.unit_id)
          .eq('payment_status', APP_CONSTANTS.PAYMENT_STATUS.CONFIRMED)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      ])

      // Processar resultados
      const appointments = appointmentsResult.data || []
      const humanRequests = humanRequestsResult.data || []
      const cycles = cyclesResult.data || [] // Pode ser usado futuramente
      const products = productsResult.data || []
      const transactions = transactionsResult.data || []

      const lowStock = products.filter(p => p.current_stock <= p.min_stock)
      const todayRevenue = transactions.reduce((sum, t) => sum + (t.gross_amount || 0), 0)
      const nextAppt = appointments.find(a => new Date(a.start_time) > new Date())

      setStats({
        todayAppointments: appointments.length,
        pendingHumanRequests: humanRequests.length,
        lateClients: 0, // Mantido simplificado conforme original
        lowStockProducts: lowStock.length,
        todayRevenue,
        nextAppointment: nextAppt
      })
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo ao {theme.brand_name || tenant?.name || 'Dashboard'}
        </h1>
        <p className="text-gray-500">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : (
        <>
          {/* Alertas Importantes */}
          {(stats.pendingHumanRequests > 0 || stats.lowStockProducts > 0) && (
            <div className="space-y-3">
              {stats.pendingHumanRequests > 0 && (
                <Link href="/chat">
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r cursor-pointer hover:bg-red-100 transition-colors">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-red-500 mr-3 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          {stats.pendingHumanRequests} cliente(s) solicitando atendimento humano
                        </p>
                        <p className="text-xs text-red-600">Clique para atender</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {stats.lowStockProducts > 0 && (
                <Link href="/estoque">
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r cursor-pointer hover:bg-orange-100 transition-colors">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-orange-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          {stats.lowStockProducts} produto(s) com estoque baixo
                        </p>
                        <p className="text-xs text-orange-600">Clique para gerenciar</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Cards de Resumo do Dia */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/agenda">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                  {stats.nextAppointment && (
                    <p className="text-xs text-gray-500 mt-1">
                      Próximo: {format(new Date(stats.nextAppointment.start_time), 'HH:mm')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>

            <Link href="/chat">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atendimentos Pendentes</CardTitle>
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingHumanRequests}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.pendingHumanRequests > 0 ? 'Requer atenção' : 'Tudo em dia'}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/financeiro">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.todayRevenue.toFixed(2)}</div>
                  <p className="text-xs text-gray-500 mt-1">Faturamento do dia</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/clientes-atrasados">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Atrasados</CardTitle>
                  <Clock className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.lateClients}</div>
                  <p className="text-xs text-gray-500 mt-1">Fora do ciclo</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Atalhos Rápidos */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/agenda" className="block group">
                <div className="bg-white p-6 rounded-lg shadow group-hover:shadow-md transition-shadow cursor-pointer h-full border border-transparent group-hover:border-[#00a884]">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    <h3 className="font-semibold text-lg group-hover:text-[#00a884]">📅 Agenda</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Visualize e gerencie agendamentos da sua equipe
                  </p>
                </div>
              </Link>

              <Link href="/professionals" className="block group">
                <div className="bg-white p-6 rounded-lg shadow group-hover:shadow-md transition-shadow cursor-pointer h-full border border-transparent group-hover:border-[#00a884]">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-6 w-6 text-indigo-600" />
                    <h3 className="font-semibold text-lg group-hover:text-[#00a884]">👥 Equipe</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Cadastre e gerencie profissionais da unidade
                  </p>
                </div>
              </Link>

              <Link href="/chat" className="block group">
                <div className="bg-white p-6 rounded-lg shadow group-hover:shadow-md transition-shadow cursor-pointer h-full border border-transparent group-hover:border-[#00a884]">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold text-lg group-hover:text-[#00a884]">💬 Conversas</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Atenda clientes via WhatsApp integrado
                  </p>
                </div>
              </Link>

              <Link href="/financeiro" className="block group">
                <div className="bg-white p-6 rounded-lg shadow group-hover:shadow-md transition-shadow cursor-pointer h-full border border-transparent group-hover:border-[#00a884]">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <h3 className="font-semibold text-lg group-hover:text-[#00a884]">💰 Financeiro</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Dashboard completo de faturamento e métricas
                  </p>
                </div>
              </Link>

              <Link href="/comissoes" className="block group">
                <div className="bg-white p-6 rounded-lg shadow group-hover:shadow-md transition-shadow cursor-pointer h-full border border-transparent group-hover:border-[#00a884]">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                    <h3 className="font-semibold text-lg group-hover:text-[#00a884]">📊 Comissões</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Ranking e relatórios de comissões por profissional
                  </p>
                </div>
              </Link>

              <Link href="/automacao-n8n" className="block group">
                <div className="bg-white p-6 rounded-lg shadow group-hover:shadow-md transition-shadow cursor-pointer h-full border border-transparent group-hover:border-[#00a884]">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="h-6 w-6 text-purple-600" />
                    <h3 className="font-semibold text-lg group-hover:text-[#00a884]">⚡ Automação n8n</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Instale workflows prontos para Salões, Clínicas, Podologias e Barbearias
                  </p>
                </div>
              </Link>

              <Link href="/estoque" className="block group">
                <div className="bg-white p-6 rounded-lg shadow group-hover:shadow-md transition-shadow cursor-pointer h-full border border-transparent group-hover:border-[#00a884]">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="h-6 w-6 text-orange-600" />
                    <h3 className="font-semibold text-lg group-hover:text-[#00a884]">📦 Estoque</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Controle completo de produtos e movimentações
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
