'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Filter,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client, ClientSegment, ClientWithRelations } from '@/types/clients'

export default function ClientesPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [clients, setClients] = useState<ClientWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    regular: 0,
    new: 0,
    inactive: 0
  })

  useEffect(() => {
    if (profile?.unit_id) {
      fetchClients()
    }
  }, [profile?.unit_id, segmentFilter])

  const fetchClients = async () => {
    if (!profile?.unit_id) return

    setLoading(true)
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          preferred_professional:profiles!clients_preferred_professional_id_fkey(
            id,
            full_name
          )
        `)
        .eq('unit_id', profile.unit_id)
        .eq('is_active', true)
        .order('full_name')

      // Aplicar filtro de segmento
      if (segmentFilter !== 'all') {
        query = query.eq('client_segment', segmentFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setClients(data || [])

      // Calcular estatísticas
      const allClients = data || []
      setStats({
        total: allClients.length,
        vip: allClients.filter(c => c.client_segment === 'vip').length,
        regular: allClients.filter(c => c.client_segment === 'regular').length,
        new: allClients.filter(c => c.client_segment === 'new').length,
        inactive: allClients.filter(c => c.client_segment === 'inactive').length
      })

    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar clientes pela busca
  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    return (
      client.full_name.toLowerCase().includes(search) ||
      client.phone?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search)
    )
  })

  const getSegmentBadge = (segment: ClientSegment) => {
    const variants = {
      vip: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'VIP' },
      regular: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Regular' },
      new: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Novo' },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Inativo' }
    }

    const variant = variants[segment]
    return (
      <Badge className={`${variant.color} border`} variant="outline">
        {variant.label}
      </Badge>
    )
  }

  const handleExport = () => {
    // TODO: Implementar exportação para Excel/CSV
    console.log('Exportar clientes:', filteredClients.length)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-gray-500">Gerencie a base de clientes do salão</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button
            className="bg-[#00a884] hover:bg-[#008f6f]"
            onClick={() => router.push('/clientes/novo')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">VIP</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.vip}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Regulares</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.regular}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Novos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.new}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Inativos</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="regular">Regulares</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Clientes */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">Carregando clientes...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </p>
              {!searchTerm && (
                <Button
                  className="mt-4"
                  onClick={() => router.push('/clientes/novo')}
                >
                  Cadastrar Primeiro Cliente
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/clientes/${client.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.full_name}</p>
                        {client.preferred_professional && (
                          <p className="text-xs text-gray-500">
                            Prefere: {client.preferred_professional.full_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSegmentBadge(client.client_segment)}
                    </TableCell>
                    <TableCell>
                      {client.last_visit_date ? (
                        <div className="text-sm">
                          {format(new Date(client.last_visit_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-700">
                        R$ {client.total_spent.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.total_visits}x</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/clientes/${client.id}`)
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
