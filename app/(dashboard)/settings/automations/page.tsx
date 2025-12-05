'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Zap, MessageSquare, CalendarCheck, CreditCard } from 'lucide-react'
import { AutomationEventType } from '@/lib/services/automation'

interface IntegrationConfig {
    id?: string
    event_type: AutomationEventType
    n8n_webhook_url: string
    is_active: boolean
}

// Lista de automações disponíveis (Mock de "Loja de Plugins")
const AVAILABLE_AUTOMATIONS = [
    {
        type: 'APPOINTMENT_CREATED',
        title: 'Confirmação de Agendamento',
        description: 'Envia mensagem no WhatsApp quando um cliente agenda.',
        icon: CalendarCheck,
        defaultUrl: 'https://n8n.seu-dominio.com/webhook/agendamento-criado'
    },
    {
        type: 'PAYMENT_CONFIRMED',
        title: 'Agradecimento de Pagamento',
        description: 'Envia recibo e agradecimento após pagamento confirmado.',
        icon: CreditCard,
        defaultUrl: 'https://n8n.seu-dominio.com/webhook/pagamento-confirmado'
    },
    {
        type: 'CLIENT_REGISTERED',
        title: 'Boas-vindas',
        description: 'Mensagem de boas-vindas para novos clientes cadastrados.',
        icon: MessageSquare,
        defaultUrl: 'https://n8n.seu-dominio.com/webhook/novo-cliente'
    }
]

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Save, X, Download } from 'lucide-react'

export default function AutomationsPage() {
    const { profile } = useAuth()
    const [loading, setLoading] = useState(true)
    const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({})
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editUrl, setEditUrl] = useState('')

    useEffect(() => {
        if (profile?.unit_id) {
            fetchConfigs()
        }
    }, [profile?.unit_id])

    const fetchConfigs = async () => {
        try {
            const { data, error } = await supabase
                .from('integrations_config')
                .select('*')
                .eq('unit_id', profile?.unit_id)

            if (error) throw error

            // Mapear array para objeto por event_type para facilitar acesso
            const configMap: Record<string, IntegrationConfig> = {}
            data?.forEach(conf => {
                configMap[conf.event_type] = conf
            })
            setConfigs(configMap)
        } catch (error) {
            console.error('Erro ao carregar automações:', error)
            toast.error('Erro ao carregar configurações.')
        } finally {
            setLoading(false)
        }
    }

    const toggleAutomation = async (type: string, defaultUrl: string, currentState: boolean) => {
        if (!profile?.unit_id) return

        // Otimistic update
        const newConfigs = { ...configs }
        const isNowActive = !currentState

        try {
            // Se já existe, atualiza. Se não, cria.
            const existing = configs[type]

            if (existing) {
                const { error } = await supabase
                    .from('integrations_config')
                    .update({ is_active: isNowActive })
                    .eq('id', existing.id)

                if (error) throw error

                newConfigs[type] = { ...existing, is_active: isNowActive }
            } else {
                const { data, error } = await supabase
                    .from('integrations_config')
                    .insert({
                        unit_id: profile.unit_id,
                        event_type: type,
                        n8n_webhook_url: defaultUrl,
                        is_active: true
                    })
                    .select()
                    .single()

                if (error) throw error

                if (data) {
                    newConfigs[type] = data
                }
            }

            setConfigs(newConfigs)
            toast.success(`Automação ${isNowActive ? 'ativada' : 'desativada'}!`)
        } catch (error) {
            console.error('Erro ao alternar automação:', error)
            toast.error('Erro ao salvar alteração.')
            // Revert optimistic update if needed (not implemented for simplicity)
        }
    }

    const startEditing = (config: IntegrationConfig) => {
        setEditingId(config.id!)
        setEditUrl(config.n8n_webhook_url)
    }

    const saveUrl = async (config: IntegrationConfig) => {
        try {
            const { error } = await supabase
                .from('integrations_config')
                .update({ n8n_webhook_url: editUrl })
                .eq('id', config.id)

            if (error) throw error

            setConfigs(prev => ({
                ...prev,
                [config.event_type]: { ...config, n8n_webhook_url: editUrl }
            }))
            setEditingId(null)
            toast.success('URL do Webhook atualizada!')
        } catch (error) {
            toast.error('Erro ao salvar URL.')
        }
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Loja de Automações</h1>
                    <p className="text-gray-500">Ative funcionalidades extras ("Plugins") para turbinar seu negócio.</p>
                </div>
                <Button variant="outline" onClick={() => window.open('/n8n_template.json', '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Template N8N
                </Button>
            </div>

            <div className="grid gap-4">
                {AVAILABLE_AUTOMATIONS.map((auto) => {
                    const config = configs[auto.type]
                    const isActive = config?.is_active || false
                    const isEditing = config?.id === editingId

                    return (
                        <Card key={auto.type} className={`transition-all ${isActive ? 'border-green-500 bg-green-50/30' : ''}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <auto.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{auto.title}</CardTitle>
                                        <CardDescription>{auto.description}</CardDescription>
                                    </div>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={() => toggleAutomation(auto.type, auto.defaultUrl, isActive)}
                                />
                            </CardHeader>
                            {isActive && config && (
                                <CardContent className="pt-0 pb-4 pl-20">
                                    {isEditing ? (
                                        <div className="flex items-end gap-2">
                                            <div className="w-full space-y-1">
                                                <Label className="text-xs">Webhook URL (N8N)</Label>
                                                <Input
                                                    value={editUrl}
                                                    onChange={e => setEditUrl(e.target.value)}
                                                    className="h-8 text-xs bg-white"
                                                />
                                            </div>
                                            <Button size="sm" onClick={() => saveUrl(config)}><Save className="h-4 w-4" /></Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 group">
                                            <span className="truncate max-w-[300px]">{config.n8n_webhook_url}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => startEditing(config)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
