'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Bell,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    MessageSquare,
    Zap,
    Settings,
    Play,
    Pause
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { useTenant } from '@/components/providers/TenantProvider'

type AutomationMetrics = {
    totalReminders24h: number
    totalReminders2h: number
    totalConfirmed: number
    totalCancelled: number
    confirmationRate: number
    noShowRate: number
    lateClients: number
    returnCyclesSent: number
}

type AutomationTemplate = {
    id: string
    name: string
    description: string
    slug: string
    default_config: any
}

type UnitAutomation = {
    id: string
    template_id: string
    is_active: boolean
    config: any
}

export default function AutomacaoPage() {
    const router = useRouter()
    const { profile } = useAuth()
    const { isPlatformAdmin, loading: tenantLoading } = useTenant()
    const [metrics, setMetrics] = useState<AutomationMetrics>({
        totalReminders24h: 0,
        totalReminders2h: 0,
        totalConfirmed: 0,
        totalCancelled: 0,
        confirmationRate: 0,
        noShowRate: 0,
        lateClients: 0,
        returnCyclesSent: 0
    })
    const [loading, setLoading] = useState(true)
    const [recentReminders, setRecentReminders] = useState<any[]>([])

    // States for Automation Config
    const [templates, setTemplates] = useState<AutomationTemplate[]>([])
    const [unitAutomations, setUnitAutomations] = useState<Record<string, UnitAutomation>>({})
    const [loadingConfig, setLoadingConfig] = useState(false)
    const [editingAutomation, setEditingAutomation] = useState<{ template: AutomationTemplate, config: string } | null>(null)

    // Platform admin access control
    useEffect(() => {
        if (!tenantLoading && !isPlatformAdmin) {
            router.push('/')
        }
    }, [isPlatformAdmin, tenantLoading, router])

    useEffect(() => {
        if (!profile?.unit_id) return
        fetchMetrics()
        fetchRecentReminders()
        fetchAutomations()
    }, [profile?.unit_id])

    const fetchMetrics = async () => {
        if (!profile?.unit_id) return

        try {
            // Buscar agendamentos do último mês
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('unit_id', profile.unit_id)
                .gte('start_time', thirtyDaysAgo.toISOString())

            if (error) throw error

            // Calcular métricas
            const total24h = appointments?.filter(a => a.reminder_24h_sent).length || 0
            const total2h = appointments?.filter(a => a.reminder_2h_sent).length || 0
            const confirmed = appointments?.filter(a => a.client_confirmed).length || 0
            const cancelled = appointments?.filter(a => a.status === 'cancelled').length || 0
            const completed = appointments?.filter(a => a.status === 'completed').length || 0
            const noShow = appointments?.filter(a => a.status === 'no_show').length || 0

            const totalWithReminder = total24h || 1 // Evitar divisão por zero
            const confirmRate = (confirmed / totalWithReminder) * 100
            const noShowRateCalc = (noShow / (completed + noShow || 1)) * 100

            setMetrics({
                totalReminders24h: total24h,
                totalReminders2h: total2h,
                totalConfirmed: confirmed,
                totalCancelled: cancelled,
                confirmationRate: confirmRate,
                noShowRate: noShowRateCalc,
                lateClients: 0, // Será calculado separadamente
                returnCyclesSent: 0 // Será calculado separadamente
            })

        } catch (error: any) {
            console.error('Erro ao buscar métricas:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchRecentReminders = async () => {
        if (!profile?.unit_id) return

        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    conversations (
                        contact_name,
                        remote_jid
                    )
                `)
                .eq('unit_id', profile.unit_id)
                .or('reminder_24h_sent.eq.true,reminder_2h_sent.eq.true')
                .order('last_reminder_sent', { ascending: false })
                .limit(10)

            if (error) throw error
            setRecentReminders(data || [])
        } catch (error: any) {
            console.error('Erro ao buscar lembretes recentes:', error)
        }
    }

    const fetchAutomations = async () => {
        if (!profile?.unit_id) return
        setLoadingConfig(true)

        try {
            // 1. Fetch Templates
            const { data: templatesData, error: templatesError } = await supabase
                .from('automation_templates')
                .select('*')
                .eq('is_active', true)

            if (templatesError) throw templatesError
            setTemplates(templatesData || [])

            // 2. Fetch Unit Automations
            const { data: unitData, error: unitError } = await supabase
                .from('unit_automations')
                .select('*')
                .eq('unit_id', profile.unit_id)

            if (unitError) throw unitError

            // Map for easier access
            const automationMap: Record<string, UnitAutomation> = {}
            unitData?.forEach(ua => {
                automationMap[ua.template_id] = ua
            })
            setUnitAutomations(automationMap)

        } catch (error: any) {
            console.error('Erro ao buscar automações:', error)
            toast.error('Erro ao carregar automações')
        } finally {
            setLoadingConfig(false)
        }
    }

    const toggleAutomation = async (templateId: string, currentState: boolean) => {
        if (!profile?.unit_id) return

        try {
            const newState = !currentState
            const existing = unitAutomations[templateId]

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('unit_automations')
                    .update({ is_active: newState })
                    .eq('id', existing.id)

                if (error) throw error

                setUnitAutomations(prev => ({
                    ...prev,
                    [templateId]: { ...existing, is_active: newState }
                }))
            } else {
                // Insert
                const template = templates.find(t => t.id === templateId)
                const { data, error } = await supabase
                    .from('unit_automations')
                    .insert({
                        unit_id: profile.unit_id,
                        template_id: templateId,
                        is_active: newState,
                        config: template?.default_config || {}
                    })
                    .select()
                    .single()

                if (error) throw error

                setUnitAutomations(prev => ({
                    ...prev,
                    [templateId]: data
                }))
            }

            toast.success(`Automação ${newState ? 'ativada' : 'desativada'} com sucesso!`)

        } catch (error: any) {
            console.error('Erro ao alternar automação:', error)
            toast.error('Erro ao atualizar automação')
        }
    }

    const saveConfig = async () => {
        if (!editingAutomation || !profile?.unit_id) return

        try {
            let parsedConfig
            try {
                parsedConfig = JSON.parse(editingAutomation.config)
            } catch (e) {
                toast.error('Configuração inválida (JSON inválido)')
                return
            }

            const templateId = editingAutomation.template.id
            const existing = unitAutomations[templateId]

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('unit_automations')
                    .update({ config: parsedConfig })
                    .eq('id', existing.id)

                if (error) throw error

                setUnitAutomations(prev => ({
                    ...prev,
                    [templateId]: { ...existing, config: parsedConfig }
                }))
            } else {
                // Insert (inactive by default if just configuring)
                const { data, error } = await supabase
                    .from('unit_automations')
                    .insert({
                        unit_id: profile.unit_id,
                        template_id: templateId,
                        is_active: false,
                        config: parsedConfig
                    })
                    .select()
                    .single()

                if (error) throw error

                setUnitAutomations(prev => ({
                    ...prev,
                    [templateId]: data
                }))
            }

            toast.success('Configuração salva!')
            setEditingAutomation(null)

        } catch (error: any) {
            console.error('Erro ao salvar configuração:', error)
            toast.error('Erro ao salvar configuração')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Automação</h1>
                <p className="text-gray-600 mt-1">
                    Gerencie seus fluxos automáticos e acompanhe métricas
                </p>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="config">Configuração</TabsTrigger>
                </TabsList>

                {/* TAB DASHBOARD */}
                <TabsContent value="dashboard" className="space-y-6 mt-6">
                    {/* Cards de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Lembretes 24h */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Lembretes 24h
                                </CardTitle>
                                <Bell className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.totalReminders24h}</div>
                                <p className="text-xs text-gray-500">
                                    Últimos 30 dias
                                </p>
                            </CardContent>
                        </Card>

                        {/* Lembretes 2h */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Lembretes 2h
                                </CardTitle>
                                <Clock className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.totalReminders2h}</div>
                                <p className="text-xs text-gray-500">
                                    Últimos 30 dias
                                </p>
                            </CardContent>
                        </Card>

                        {/* Taxa de Confirmação */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Taxa de Confirmação
                                </CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metrics.confirmationRate.toFixed(1)}%
                                </div>
                                <p className="text-xs text-gray-500">
                                    {metrics.totalConfirmed} confirmados
                                </p>
                            </CardContent>
                        </Card>

                        {/* Taxa de No-Show */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Taxa de No-Show
                                </CardTitle>
                                <XCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metrics.noShowRate.toFixed(1)}%
                                </div>
                                <p className="text-xs text-gray-500">
                                    {metrics.noShowRate < 10 ? 'Excelente!' : 'Precisa melhorar'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lembretes Recentes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lembretes Recentes</CardTitle>
                            <CardDescription>
                                Últimos 10 lembretes enviados automaticamente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentReminders.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                    <p>Nenhum lembrete enviado ainda</p>
                                    <p className="text-sm">Os lembretes aparecerão aqui quando forem enviados</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentReminders.map((reminder) => (
                                        <div
                                            key={reminder.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${reminder.client_confirmed
                                                    ? 'bg-green-100'
                                                    : reminder.status === 'cancelled'
                                                        ? 'bg-red-100'
                                                        : 'bg-gray-100'
                                                    }`}>
                                                    {reminder.client_confirmed ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : reminder.status === 'cancelled' ? (
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-gray-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {reminder.conversations?.contact_name || 'Cliente'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {reminder.service_name} • {reminder.professional_name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {reminder.start_time && format(
                                                            new Date(reminder.start_time),
                                                            "dd/MM/yyyy 'às' HH:mm",
                                                            { locale: ptBR }
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {reminder.reminder_24h_sent && (
                                                    <Badge variant="outline" className="mb-1">
                                                        24h
                                                    </Badge>
                                                )}
                                                {reminder.reminder_2h_sent && (
                                                    <Badge variant="outline">
                                                        2h
                                                    </Badge>
                                                )}
                                                {reminder.client_confirmed && (
                                                    <Badge className="bg-green-600 ml-2">
                                                        Confirmado
                                                    </Badge>
                                                )}
                                                {reminder.status === 'cancelled' && (
                                                    <Badge variant="destructive" className="ml-2">
                                                        Cancelado
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB CONFIGURAÇÃO */}
                <TabsContent value="config" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 gap-4">
                        {templates.map((template) => {
                            const unitAutomation = unitAutomations[template.id]
                            const isActive = unitAutomation?.is_active || false

                            return (
                                <Card key={template.id} className={isActive ? "border-green-200 bg-green-50/30" : ""}>
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                <Zap className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                                {template.name}
                                            </CardTitle>
                                            <CardDescription className="text-sm max-w-md">
                                                {template.description}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                                    {isActive ? 'Ativado' : 'Desativado'}
                                                </span>
                                                <Switch
                                                    checked={isActive}
                                                    onCheckedChange={() => toggleAutomation(template.id, isActive)}
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-end pt-2">
                                            <Dialog open={editingAutomation?.template.id === template.id} onOpenChange={(open) => {
                                                if (!open) setEditingAutomation(null)
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        const currentConfig = unitAutomation?.config || template.default_config
                                                        setEditingAutomation({
                                                            template,
                                                            config: JSON.stringify(currentConfig, null, 2)
                                                        })
                                                    }}>
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Configurar
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Configurar {template.name}</DialogTitle>
                                                        <DialogDescription>
                                                            Ajuste as mensagens e parâmetros desta automação.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label>Configuração (JSON)</Label>
                                                            <Textarea
                                                                className="font-mono text-xs h-[200px]"
                                                                value={editingAutomation?.config || ''}
                                                                onChange={(e) => setEditingAutomation(prev => prev ? ({ ...prev, config: e.target.value }) : null)}
                                                            />
                                                            <p className="text-xs text-gray-500">
                                                                Edite o JSON acima com cuidado. Mantenha a estrutura.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setEditingAutomation(null)}>Cancelar</Button>
                                                        <Button onClick={saveConfig}>Salvar Alterações</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {templates.length === 0 && !loadingConfig && (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                                <Zap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">Nenhuma automação disponível</h3>
                                <p className="text-gray-500">Em breve novas automações serão adicionadas.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
