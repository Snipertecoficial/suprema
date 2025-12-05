'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Service = {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
}

type Unit = {
    id: string
    name: string
    address: string | null
}

export default function ConfiguracoesPage() {
    const { profile } = useAuth()
    const [unit, setUnit] = useState<Unit | null>(null)
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Estados para edição de unidade
    const [unitName, setUnitName] = useState('')
    const [unitAddress, setUnitAddress] = useState('')

    // Estados para serviços
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [serviceName, setServiceName] = useState('')
    const [serviceDescription, setServiceDescription] = useState('')
    const [serviceDuration, setServiceDuration] = useState('')
    const [servicePrice, setServicePrice] = useState('')

    useEffect(() => {
        if (profile?.unit_id) {
            fetchData()
        }
    }, [profile?.unit_id])

    const fetchData = async () => {
        if (!profile?.unit_id) return

        // Buscar dados da unidade
        const { data: unitData } = await supabase
            .from('units')
            .select('*')
            .eq('id', profile.unit_id)
            .single()

        if (unitData) {
            setUnit(unitData)
            setUnitName(unitData.name)
            setUnitAddress(unitData.address || '')
        }

        // Buscar serviços
        const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('unit_id', profile.unit_id)
            .order('name')

        if (servicesData) {
            setServices(servicesData)
        }

        setLoading(false)
    }

    const handleSaveUnit = async () => {
        if (!unit) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('units')
                .update({
                    name: unitName,
                    address: unitAddress
                })
                .eq('id', unit.id)

            if (error) throw error

            toast.success('Unidade atualizada com sucesso!')
            fetchData()
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleOpenServiceDialog = (service?: Service) => {
        if (service) {
            setEditingService(service)
            setServiceName(service.name)
            setServiceDescription(service.description || '')
            setServiceDuration(service.duration.toString())
            setServicePrice(service.price.toString())
        } else {
            setEditingService(null)
            setServiceName('')
            setServiceDescription('')
            setServiceDuration('')
            setServicePrice('')
        }
        setIsServiceDialogOpen(true)
    }

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.unit_id) return

        setSaving(true)
        try {
            const serviceData = {
                name: serviceName,
                description: serviceDescription || null,
                duration: parseInt(serviceDuration),
                price: parseFloat(servicePrice),
                unit_id: profile.unit_id
            }

            if (editingService) {
                // Atualizar
                const { error } = await supabase
                    .from('services')
                    .update(serviceData)
                    .eq('id', editingService.id)

                if (error) throw error
            } else {
                // Criar
                const { error } = await supabase
                    .from('services')
                    .insert(serviceData)

                if (error) throw error
            }

            setIsServiceDialogOpen(false)
            fetchData()
        } catch (error: any) {
            toast.error('Erro ao salvar serviço: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteService = async (serviceId: string) => {
        if (!confirm('Tem certeza que deseja excluir este serviço?')) return

        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId)

            if (error) throw error

            fetchData()
        } catch (error: any) {
            toast.error('Erro ao excluir: ' + error.message)
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando...</div>

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-gray-500">Gerencie as preferências do sistema.</p>
            </div>

            <Tabs defaultValue="unit" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="unit">Unidade</TabsTrigger>
                    <TabsTrigger value="services">Serviços</TabsTrigger>
                    <TabsTrigger value="integrations">Integrações</TabsTrigger>
                </TabsList>

                {/* Aba de Unidade */}
                <TabsContent value="unit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil da Unidade</CardTitle>
                            <CardDescription>Informações visíveis para os clientes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Nome da Unidade</Label>
                                <Input
                                    value={unitName}
                                    onChange={(e) => setUnitName(e.target.value)}
                                    placeholder="Ex: Beto Style - Matriz"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Endereço</Label>
                                <Input
                                    value={unitAddress}
                                    onChange={(e) => setUnitAddress(e.target.value)}
                                    placeholder="Ex: R. Visc. de Abaeté, 184 - Brás"
                                />
                            </div>
                            <Button
                                onClick={handleSaveUnit}
                                disabled={saving}
                                className="w-fit bg-[#00a884] hover:bg-[#008f6f]"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Aba de Serviços */}
                <TabsContent value="services" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Serviços Oferecidos</CardTitle>
                                <CardDescription>Gerencie os serviços disponíveis para agendamento.</CardDescription>
                            </div>
                            <Button
                                onClick={() => handleOpenServiceDialog()}
                                className="bg-[#00a884] hover:bg-[#008f6f]"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Serviço
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {services.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>Nenhum serviço cadastrado.</p>
                                    <p className="text-sm mt-2">Clique em "Novo Serviço" para começar.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Duração</TableHead>
                                            <TableHead>Preço</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services.map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell className="font-medium">
                                                    {service.name}
                                                    {service.description && (
                                                        <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{service.duration} min</Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold text-green-700">
                                                    R$ {service.price.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenServiceDialog(service)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteService(service.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Aba de Integrações */}
                <TabsContent value="integrations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Integrações</CardTitle>
                            <CardDescription>Conexão com WhatsApp e IA.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>WhatsApp (Evolution API)</Label>
                                    <p className="text-sm text-muted-foreground">Conectado como Beto Style</p>
                                </div>
                                <Switch checked={true} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Inteligência Artificial (n8n)</Label>
                                    <p className="text-sm text-muted-foreground">Respondendo automaticamente</p>
                                </div>
                                <Switch checked={true} />
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r mt-4">
                                <p className="text-sm text-blue-700">
                                    <strong>Nota:</strong> As integrações são gerenciadas pelo n8n. Para configurar webhooks e fluxos, acesse o painel do n8n.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de Serviço */}
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
                        <DialogDescription>
                            {editingService ? 'Atualize as informações do serviço.' : 'Adicione um novo serviço ao catálogo.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveService} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="service-name">Nome do Serviço *</Label>
                            <Input
                                id="service-name"
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                                placeholder="Ex: Corte Masculino"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="service-description">Descrição (opcional)</Label>
                            <Input
                                id="service-description"
                                value={serviceDescription}
                                onChange={(e) => setServiceDescription(e.target.value)}
                                placeholder="Ex: Corte tradicional com máquina e tesoura"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="service-duration">Duração (min) *</Label>
                                <Input
                                    id="service-duration"
                                    type="number"
                                    value={serviceDuration}
                                    onChange={(e) => setServiceDuration(e.target.value)}
                                    placeholder="30"
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="service-price">Preço (R$) *</Label>
                                <Input
                                    id="service-price"
                                    type="number"
                                    step="0.01"
                                    value={servicePrice}
                                    onChange={(e) => setServicePrice(e.target.value)}
                                    placeholder="50.00"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving} className="bg-[#00a884] hover:bg-[#008f6f]">
                                {saving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
