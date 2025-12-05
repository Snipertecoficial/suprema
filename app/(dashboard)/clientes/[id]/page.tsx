'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  Heart,
  ShoppingBag,
  TrendingUp,
  Clock,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client } from '@/types/clients'

export default function ClienteDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()

  const [client, setClient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const clientId = params.id as string

  useEffect(() => {
    if (clientId && profile?.unit_id) {
      fetchClientData()
    }
  }, [clientId, profile?.unit_id])

  const fetchClientData = async () => {
    setLoading(true)

    try {
      // Buscar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          preferred_professional:profiles!clients_preferred_professional_id_fkey(
            id,
            full_name
          )
        `)
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Buscar agendamentos do cliente
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('start_time', { ascending: false })
        .limit(10)

      if (appointmentsError) throw appointmentsError
      setAppointments(appointmentsData || [])

    } catch (error: any) {
      console.error('Erro ao carregar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSegmentInfo = (segment: string) => {
    const segments = {
      vip: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'VIP', icon: '👑' },
      regular: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Regular', icon: '⭐' },
      new: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Novo', icon: '🌟' },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Inativo', icon: '😴' }
    }
    return segments[segment as keyof typeof segments] || segments.new
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Carregando...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Cliente não encontrado</p>
          <Button onClick={() => router.push('/clientes')} className="mt-4">
            Voltar para Clientes
          </Button>
        </div>
      </div>
    )
  }

  const segmentInfo = getSegmentInfo(client.client_segment)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/clientes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{client.full_name}</h1>
              <Badge className={`${segmentInfo.color} border`} variant="outline">
                {segmentInfo.icon} {segmentInfo.label}
              </Badge>
            </div>
            <p className="text-gray-500">Cliente desde {client.first_visit_date ? format(new Date(client.first_visit_date), "dd/MM/yyyy", { locale: ptBR }) : 'Nunca veio'}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/clientes/${clientId}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              R$ {client.total_spent.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.total_visits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {client.average_ticket.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Visita</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {client.last_visit_date
                ? format(new Date(client.last_visit_date), "dd/MM/yyyy", { locale: ptBR })
                : 'Nunca'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Informações */}
      <Tabs defaultValue="dados" className="w-full">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="saude">Saúde</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
        </TabsList>

        {/* Aba: Dados Pessoais */}
        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{client.phone || 'Não informado'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{client.email || 'Não informado'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {client.birth_date
                        ? format(new Date(client.birth_date), "dd/MM/yyyy", { locale: ptBR })
                        : 'Não informado'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CPF</label>
                  <div className="mt-1">{client.cpf || 'Não informado'}</div>
                </div>
              </div>

              {client.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Endereço</label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>{client.address}, {client.address_number}</p>
                      {client.address_complement && <p>{client.address_complement}</p>}
                      <p>{client.neighborhood} - {client.city}/{client.state}</p>
                      <p className="text-gray-500">CEP: {client.zip_code}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Preferências de Contato</label>
                <div className="flex gap-2 mt-2">
                  {client.whatsapp_consent && <Badge variant="outline">WhatsApp ✓</Badge>}
                  {client.sms_consent && <Badge variant="outline">SMS ✓</Badge>}
                  {client.email_consent && <Badge variant="outline">Email ✓</Badge>}
                  {client.marketing_consent && <Badge variant="outline">Marketing ✓</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum atendimento registrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          {format(new Date(apt.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{apt.service_name}</TableCell>
                        <TableCell>{apt.professional_name}</TableCell>
                        <TableCell>
                          <Badge variant={apt.status === 'completed' ? 'default' : 'outline'}>
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {apt.price?.toFixed(2) || '0.00'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Saúde */}
        <TabsContent value="saude" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Informações de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.allergies && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Alergias</p>
                      <p className="text-sm text-red-700 mt-1">{client.allergies}</p>
                    </div>
                  </div>
                </div>
              )}

              {client.health_restrictions && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Restrições de Saúde</p>
                      <p className="text-sm text-yellow-700 mt-1">{client.health_restrictions}</p>
                    </div>
                  </div>
                </div>
              )}

              {!client.allergies && !client.health_restrictions && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma informação de saúde registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Observações */}
        <TabsContent value="observacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {client.notes || 'Nenhuma observação registrada'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações Internas (Equipe)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700">
                {client.internal_notes || 'Nenhuma observação interna'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
