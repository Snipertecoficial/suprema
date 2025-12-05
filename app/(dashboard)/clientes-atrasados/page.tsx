'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, Send, AlertCircle, Calendar, User, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type LateClient = {
    client_name: string
    phone: string
    last_service: string
    last_date: string
    expected_cycle_days: number
    days_late: number
    conversation_id: string
}

export default function ClientesAtrasadosPage() {
    const { profile } = useAuth()
    const [lateClients, setLateClients] = useState<LateClient[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.unit_id) {
            fetchLateClients()
        }
    }, [profile?.unit_id])

    const fetchLateClients = async () => {
        if (!profile?.unit_id) return

        setLoading(true)
        try {
            // Buscar últimos agendamentos de cada cliente
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select(`
          *,
          conversations!inner(contact_name, remote_jid, id)
        `)
                .eq('unit_id', profile.unit_id)
                .eq('status', 'completed')
                .order('start_time', { ascending: false })

            if (error) throw error

            // Buscar ciclos de serviços
            const { data: cycles } = await supabase
                .from('service_cycles')
                .select('*')
                .eq('unit_id', profile.unit_id)

            const cycleMap = new Map(cycles?.map(c => [c.service_name, c.average_days]) || [])

            // Agrupar por cliente e calcular atraso
            const clientMap = new Map<string, any>()

            appointments?.forEach(appt => {
                const clientId = appt.conversations?.id
                if (!clientId || clientMap.has(clientId)) return // Pega apenas o mais recente

                const lastDate = parseISO(appt.start_time)
                const expectedCycleDays = cycleMap.get(appt.service_name) || 30
                const daysSinceLast = differenceInDays(new Date(), lastDate)
                const daysLate = daysSinceLast - expectedCycleDays

                if (daysLate > 0) { // Cliente está atrasado
                    clientMap.set(clientId, {
                        client_name: appt.conversations?.contact_name || 'Cliente',
                        phone: appt.conversations?.remote_jid || '',
                        last_service: appt.service_name,
                        last_date: appt.start_time,
                        expected_cycle_days: expectedCycleDays,
                        days_late: daysLate,
                        conversation_id: clientId
                    })
                }
            })

            const lateList = Array.from(clientMap.values())
                .sort((a, b) => b.days_late - a.days_late)

            setLateClients(lateList)
        } catch (error) {
            console.error('Erro ao buscar clientes atrasados:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendReminderMessage = async (client: LateClient) => {
        // Aqui você pode integrar com n8n ou enviar direto via API do WhatsApp
        toast.success(`Mensagem de lembrete enviada para ${client.client_name}!`)
        // TODO: Implementar envio real via webhook n8n
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Clientes Atrasados (Ciclo de Retorno)</h1>
                <p className="text-gray-500">Clientes que passaram do tempo estimado para retornar ao salão.</p>

                <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Como funciona:</strong> Esta lista mostra clientes que já deveriam ter voltado baseando-se no ciclo do serviço (ex: Corte Masculino = 20 dias).
                                <br />
                                <em>Nota: Lembretes de agendamentos confirmados (24h e 2h antes) são enviados automaticamente pelo WhatsApp e não aparecem aqui.</em>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Carregando...</div>
            ) : lateClients.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="text-gray-400 space-y-2">
                        <Clock size={48} className="mx-auto opacity-50" />
                        <p className="text-lg font-medium">Nenhum cliente atrasado!</p>
                        <p className="text-sm">Todos os clientes estão em dia com seus ciclos de retorno 🎉</p>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {lateClients.map((client, idx) => (
                        <Card key={idx} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-4 pb-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-red-100 text-red-700">
                                        {client.client_name[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{client.client_name}</CardTitle>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Phone size={12} />
                                        <span>{client.phone.replace('@s.whatsapp.net', '')}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar size={14} className="text-gray-400" />
                                    <div>
                                        <p className="font-medium">{client.last_service}</p>
                                        <p className="text-xs text-gray-500">
                                            Última visita: {format(parseISO(client.last_date), 'dd/MM/yyyy', { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Badge variant="destructive" className="text-xs">
                                        {client.days_late} dias atrasado
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                        Ciclo: {client.expected_cycle_days} dias
                                    </span>
                                </div>

                                <Button
                                    onClick={() => sendReminderMessage(client)}
                                    className="w-full bg-[#00a884] hover:bg-[#008f6f]"
                                    size="sm"
                                >
                                    Enviar Lembrete
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
