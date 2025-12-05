'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Edit2,
    Trash2,
    Scissors,
    Clock,
    DollarSign,
    Percent,
    Search,
    MoreVertical
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Service {
    id: string
    name: string
    price: number
    duration_minutes: number
    commission_percentage: number
    active: boolean
    created_at: string
}

export default function ServicosPage() {
    const { profile } = useAuth()
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration_minutes: '30',
        commission_percentage: '50',
        active: true
    })

    useEffect(() => {
        if (profile?.unit_id) {
            loadServices()
        }
    }, [profile?.unit_id])

    async function loadServices() {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('unit_id', profile?.unit_id)
                .order('name')

            if (error) throw error
            setServices(data || [])
        } catch (error) {
            console.error('Erro ao carregar serviços:', error)
        } finally {
            setLoading(false)
        }
    }

    function openNewServiceDialog() {
        setEditingService(null)
        setFormData({
            name: '',
            price: '',
            duration_minutes: '30',
            commission_percentage: '50',
            active: true
        })
        setDialogOpen(true)
    }

    function openEditDialog(service: Service) {
        setEditingService(service)
        setFormData({
            name: service.name,
            price: service.price.toString(),
            duration_minutes: service.duration_minutes.toString(),
            commission_percentage: service.commission_percentage.toString(),
            active: service.active
        })
        setDialogOpen(true)
    }

    async function handleSave() {
        if (!formData.name || !formData.price) {
            alert('Preencha nome e preço do serviço')
            return
        }

        setSaving(true)
        try {
            const serviceData = {
                unit_id: profile?.unit_id,
                name: formData.name,
                price: parseFloat(formData.price),
                duration_minutes: parseInt(formData.duration_minutes),
                commission_percentage: parseFloat(formData.commission_percentage),
                active: formData.active
            }

            if (editingService) {
                const { error } = await supabase
                    .from('services')
                    .update(serviceData)
                    .eq('id', editingService.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('services')
                    .insert(serviceData)

                if (error) throw error
            }

            setDialogOpen(false)
            loadServices()
        } catch (error: any) {
            console.error('Erro ao salvar serviço:', error)
            alert('Erro ao salvar serviço: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Deseja realmente excluir o serviço "${name}"?`)) return

        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id)

            if (error) throw error
            loadServices()
        } catch (error: any) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir serviço: ' + error.message)
        }
    }

    async function toggleActive(service: Service) {
        try {
            const { error } = await supabase
                .from('services')
                .update({ active: !service.active })
                .eq('id', service.id)

            if (error) throw error
            loadServices()
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
        }
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const activeServices = services.filter(s => s.active).length
    const totalRevenuePotential = services.reduce((sum, s) => sum + s.price, 0)

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Serviços</h1>
                    <p className="text-gray-500">Gerencie os serviços oferecidos</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewServiceDialog} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Serviço
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Serviço *</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Corte Masculino"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Preço (R$) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        placeholder="50.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duração (min)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        placeholder="30"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="commission">Comissão (%)</Label>
                                <Input
                                    id="commission"
                                    type="number"
                                    step="0.1"
                                    placeholder="50"
                                    value={formData.commission_percentage}
                                    onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">
                                    Porcentagem paga ao profissional que realizar o serviço
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="rounded"
                                />
                                <Label htmlFor="active">Serviço ativo</Label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{services.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeServices} ativos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {services.length > 0 ? (totalRevenuePotential / services.length).toFixed(2) : '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            por serviço
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {services.length > 0
                                ? Math.round(services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length)
                                : 0} min
                        </div>
                        <p className="text-xs text-muted-foreground">
                            por serviço
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar serviço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Serviço</TableHead>
                                <TableHead className="text-right">Preço</TableHead>
                                <TableHead className="text-center">Duração</TableHead>
                                <TableHead className="text-center">Comissão</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredServices.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                <Scissors className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-medium">{service.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        R$ {service.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1 text-gray-600">
                                            <Clock className="w-3 h-3" />
                                            {service.duration_minutes} min
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1 text-gray-600">
                                            <Percent className="w-3 h-3" />
                                            {service.commission_percentage}%
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={service.active ? 'default' : 'secondary'}
                                            className={service.active ? 'bg-green-100 text-green-800' : ''}
                                        >
                                            {service.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(service)}>
                                                    <Edit2 className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleActive(service)}>
                                                    {service.active ? 'Desativar' : 'Ativar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(service.id, service.name)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredServices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        {searchTerm
                                            ? 'Nenhum serviço encontrado'
                                            : 'Nenhum serviço cadastrado. Clique em "Novo Serviço" para começar.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
