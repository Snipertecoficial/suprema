'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { ChevronLeft, ChevronRight, Clock, User, DollarSign, Calendar as CalendarIcon, Plus, Filter, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from "@/components/ui/checkbox"
import { PhotoUploader } from '../appointments/PhotoUploader'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/AuthProvider'
import { triggerAutomation } from '@/lib/services/automation'

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
    conversations?: {
        contact_name: string | null
        remote_jid: string
    } | null
}

type Professional = {
    id: string
    full_name: string
}

type Service = {
    id: string
    name: string
    price: number
    duration: number
}

// Cores pré-definidas
const availableColors = [
    'bg-blue-100 border-blue-500 text-blue-900',
    'bg-pink-100 border-pink-500 text-pink-900',
    'bg-purple-100 border-purple-500 text-purple-900',
    'bg-green-100 border-green-500 text-green-900',
    'bg-orange-100 border-orange-500 text-orange-900',
    'bg-teal-100 border-teal-500 text-teal-900',
    'bg-red-100 border-red-500 text-red-900',
    'bg-indigo-100 border-indigo-500 text-indigo-900',
    'bg-yellow-100 border-yellow-500 text-yellow-900',
]

export function CalendarView() {
    const { profile, loading } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([])
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [profColors, setProfColors] = useState<Record<string, string>>({})

    // Estado de visualização: 'day', 'week', 'month'
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')

    // Estado para criação de agendamento
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newApptDate, setNewApptDate] = useState<Date | null>(null)
    const [newApptTime, setNewApptTime] = useState('')
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [selectedProfId, setSelectedProfId] = useState('')
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [creating, setCreating] = useState(false)

    // Estado para edição de agendamento
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
    const [editServiceId, setEditServiceId] = useState('')
    const [editProfId, setEditProfId] = useState('')
    const [editDate, setEditDate] = useState('')
    const [editTime, setEditTime] = useState('')
    const [updating, setUpdating] = useState(false)

    // Estado para exclusão
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null)
    const [deleting, setDeleting] = useState(false)

    const startDate = viewMode === 'day'
        ? currentDate
        : viewMode === 'week'
            ? startOfWeek(currentDate, { weekStartsOn: 0 })
            : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    const daysToShow = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30
    const weekDays = Array.from({ length: daysToShow }).map((_, i) => addDays(startDate, i))

    const startHour = 7
    const endHour = 21
    const timeSlots = Array.from({ length: endHour - startHour + 1 }).map((_, i) => startHour + i)

    // Buscar Dados Iniciais
    useEffect(() => {
        if (!profile?.unit_id) return

        const fetchData = async () => {
            // Profissionais
            const { data: profsData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('unit_id', profile.unit_id)
                .eq('role', 'professional')

            if (profsData) {
                const profs = profsData as Professional[]
                setProfessionals(profs)
                setSelectedProfessionals(profs.map(p => p.full_name))

                const colors: Record<string, string> = {}
                profs.forEach((p, index) => {
                    colors[p.full_name] = availableColors[index % availableColors.length]
                })
                setProfColors(colors)
            }

            // Serviços
            const { data: servicesData } = await supabase
                .from('services')
                .select('*')
                .eq('unit_id', profile.unit_id)

            if (servicesData) setServices(servicesData)
        }

        fetchData()
    }, [profile?.unit_id])

    // Buscar Agendamentos
    const fetchAppointments = async () => {
        if (!profile?.unit_id) return
        const { data } = await supabase
            .from('appointments')
            .select('*, conversations(contact_name, remote_jid)')
            .eq('unit_id', profile.unit_id)

        if (data) setAppointments(data as Appointment[])
    }

    useEffect(() => {
        fetchAppointments()
    }, [currentDate, profile?.unit_id])

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7))
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7))

    const getProfessionalColor = (name: string) => {
        return profColors[name] || 'bg-gray-100 border-gray-500 text-gray-900'
    }

    const toggleProfessional = (profName: string) => {
        setSelectedProfessionals(prev =>
            prev.includes(profName)
                ? prev.filter(p => p !== profName)
                : [...prev, profName]
        )
    }

    const viewOnlyProfessional = (profName: string) => {
        setSelectedProfessionals([profName])
    }

    const handleSlotClick = (day: Date, hour: number) => {
        const clickedDate = setMinutes(setHours(day, hour), 0)
        setNewApptDate(clickedDate)
        setNewApptTime(format(clickedDate, 'HH:mm'))
        setIsCreateOpen(true)
    }

    // Função para clique em célula (nova estrutura)
    const handleCellClick = (cellDate: Date) => {
        setNewApptDate(cellDate)
        setNewApptTime(format(cellDate, 'HH:mm'))
        setIsCreateOpen(true)
    }

    // Abrir modal de edição
    const handleEditClick = (appointment: Appointment) => {
        setEditingAppointment(appointment)
        const startDate = parseISO(appointment.start_time)
        setEditDate(format(startDate, 'yyyy-MM-dd'))
        setEditTime(format(startDate, 'HH:mm'))

        // Encontrar service_id e professional_id
        const service = services.find(s => s.name === appointment.service_name)
        const prof = professionals.find(p => p.full_name === appointment.professional_name)

        setEditServiceId(service?.id || '')
        setEditProfId(prof?.id || '')
        setIsEditOpen(true)
        setSelectedAppointment(null) // Fechar modal de detalhes
    }

    // Salvar edição
    const handleUpdateAppointment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingAppointment || !editServiceId || !editProfId || !editDate || !editTime) return

        setUpdating(true)
        try {
            const service = services.find(s => s.id === editServiceId)
            const professional = professionals.find(p => p.id === editProfId)
            if (!service || !professional) throw new Error('Serviço ou profissional não encontrado')

            const [hours, minutes] = editTime.split(':')
            const start = setMinutes(setHours(new Date(editDate), parseInt(hours)), parseInt(minutes))
            const end = new Date(start.getTime() + service.duration * 60000)

            const { error } = await supabase
                .from('appointments')
                .update({
                    professional_name: professional.full_name,
                    service_name: service.name,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    price: service.price
                })
                .eq('id', editingAppointment.id)

            if (error) throw error

            setIsEditOpen(false)
            fetchAppointments()
        } catch (error: any) {
            alert('Erro ao atualizar: ' + error.message)
        } finally {
            setUpdating(false)
        }
    }

    // Abrir modal de exclusão
    const handleDeleteClick = (appointment: Appointment) => {
        setDeletingAppointment(appointment)
        setIsDeleteOpen(true)
        setSelectedAppointment(null) // Fechar modal de detalhes
    }

    // Confirmar exclusão
    const handleConfirmDelete = async () => {
        if (!deletingAppointment) return

        setDeleting(true)
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', deletingAppointment.id)

            if (error) throw error

            setIsDeleteOpen(false)
            setDeletingAppointment(null)
            fetchAppointments()
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message)
        } finally {
            setDeleting(false)
        }
    }

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newApptDate || !selectedServiceId || !selectedProfId || !profile?.unit_id) return

        setCreating(true)
        try {
            const service = services.find(s => s.id === selectedServiceId)
            const professional = professionals.find(p => p.id === selectedProfId)

            if (!service || !professional) throw new Error('Dados inválidos')

            const [hours, minutes] = newApptTime.split(':').map(Number)
            const start = setHours(setMinutes(newApptDate, minutes), hours)
            const end = new Date(start.getTime() + service.duration * 60000)

            // Validar conflitos de horário
            const hasConflict = appointments.some(apt => {
                if (apt.professional_name !== professional.full_name) return false
                const aptStart = new Date(apt.start_time)
                const aptEnd = new Date(apt.end_time)
                return (
                    (start >= aptStart && start < aptEnd) ||
                    (end > aptStart && end <= aptEnd) ||
                    (start <= aptStart && end >= aptEnd)
                )
            })

            if (hasConflict) {
                toast.error('Conflito de horário! Já existe um agendamento neste horário para este profissional.')
                setCreating(false)
                return
            }

            // 1. Criar ou buscar conversa (cliente)
            // Simplificação: Vamos criar um agendamento sem conversa vinculada se não existir, 
            // mas idealmente buscaríamos pelo telefone.
            // Para MVP rápido, vamos salvar o nome no campo contact_name da conversa se criarmos uma.

            // Vamos criar uma conversa "dummy" se não tivermos ID, ou usar null.
            // O ideal é ter uma tabela de clientes separada, mas estamos usando conversations.
            // Vamos criar uma conversa nova se o telefone for fornecido.

            let conversationId = null
            if (clientPhone) {
                const { data: convData } = await supabase
                    .from('conversations')
                    .upsert({
                        remote_jid: clientPhone.includes('@') ? clientPhone : `${clientPhone}@s.whatsapp.net`,
                        contact_name: clientName,
                        unit_id: profile.unit_id
                    }, { onConflict: 'remote_jid' })
                    .select()
                    .single()

                if (convData) conversationId = convData.id
            }

            // ... inside handleCreateAppointment ...

            const { data: newAppointment, error } = await supabase.from('appointments').insert({
                unit_id: profile.unit_id,
                conversation_id: conversationId, // Pode ser null
                professional_name: professional.full_name,
                service_name: service.name,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                status: 'scheduled',
                price: service.price
            }).select().single()

            if (error) throw error

            // 🚀 Disparar Automação
            await triggerAutomation(profile.unit_id, 'APPOINTMENT_CREATED', {
                appointment_id: newAppointment.id,
                client_name: clientName,
                client_phone: clientPhone,
                service_name: service.name,
                professional_name: professional.full_name,
                start_time: start.toISOString(),
                price: service.price
            })

            setIsCreateOpen(false)
            fetchAppointments()
            // Limpar form
            setClientName('')
            setClientPhone('')
            setSelectedServiceId('')
            setSelectedProfId('')

        } catch (error: any) {
            toast.error('Erro ao agendar: ' + error.message)
        } finally {
            setCreating(false)
        }
    }

    const filteredAppointments = appointments.filter(app =>
        selectedProfessionals.includes(app.professional_name)
    )

    if (loading) return <div className="p-8 text-center">Carregando agenda...</div>
    if (!profile) return <div className="p-8 text-center">Acesso negado. Faça login.</div>

    return (
        <div className="flex h-full bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Sidebar de Filtros */}
            <div className="w-64 border-r bg-gray-50 p-4 flex flex-col gap-6 hidden md:flex">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Filter size={16} /> Filtros
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedProfessionals(professionals.map(p => p.full_name))}>
                            Todos
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {professionals.map(prof => {
                            const isSelected = selectedProfessionals.includes(prof.full_name);
                            return (
                                <div key={prof.id} className={`group flex items-center justify-between p-2 rounded-md transition-colors ${isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`prof-${prof.id}`}
                                            checked={isSelected}
                                            onCheckedChange={() => toggleProfessional(prof.full_name)}
                                        />
                                        <label
                                            htmlFor={`prof-${prof.id}`}
                                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                        >
                                            <div className={`w-3 h-3 rounded-full ${getProfessionalColor(prof.full_name).split(' ')[0]}`}></div>
                                            <span className={isSelected ? 'font-semibold' : ''}>{prof.full_name}</span>
                                        </label>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => viewOnlyProfessional(prof.full_name)}
                                        title="Ver apenas este"
                                    >
                                        <Eye size={14} />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Calendário Principal */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold capitalize text-gray-800">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft size={18} /></Button>
                            <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight size={18} /></Button>
                            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filtros de Visualização */}
                        <div className="flex gap-1 border rounded-lg p-1">
                            <Button
                                variant={viewMode === 'day' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('day')}
                                className={viewMode === 'day' ? 'bg-[#00a884] hover:bg-[#008f6f]' : ''}
                            >
                                Dia
                            </Button>
                            <Button
                                variant={viewMode === 'week' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('week')}
                                className={viewMode === 'week' ? 'bg-[#00a884] hover:bg-[#008f6f]' : ''}
                            >
                                Semana
                            </Button>
                            <Button
                                variant={viewMode === 'month' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('month')}
                                className={viewMode === 'month' ? 'bg-[#00a884] hover:bg-[#008f6f]' : ''}
                            >
                                Mês
                            </Button>
                        </div>

                        <Button onClick={() => {
                            setNewApptDate(new Date())
                            setNewApptTime("09:00")
                            setIsCreateOpen(true)
                        }} className="bg-[#00a884] hover:bg-[#008f6f]">
                            <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
                        </Button>
                    </div>
                </div>

                {/* Grid do Calendário */}
                <ScrollArea className="flex-1">
                    <div className="min-w-[800px]">
                        {/* Header dos Dias */}
                        <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
                            <div className="p-2 text-xs font-medium text-gray-500 border-r">Horário</div>
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className="p-2 text-center border-r">
                                    <div className="text-xs text-gray-500 capitalize">
                                        {format(day, 'EEE', { locale: ptBR })}
                                    </div>
                                    <div className={`text-lg font-semibold ${isSameDay(day, new Date()) ? 'text-[#00a884]' : 'text-gray-900'
                                        }`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grid de Horários */}
                        <div className="relative">
                            {timeSlots.map(hour => (
                                <div key={hour} className="grid grid-cols-8 border-b" style={{ minHeight: '80px' }}>
                                    <div className="p-2 text-xs text-gray-500 border-r bg-gray-50 flex items-start">
                                        {hour}:00
                                    </div>
                                    {weekDays.map(day => {
                                        const cellDate = setMinutes(setHours(day, hour), 0)
                                        const cellAppointments = filteredAppointments.filter(app => {
                                            const appStart = parseISO(app.start_time)
                                            return isSameDay(appStart, day) && appStart.getHours() === hour
                                        })

                                        return (
                                            <div
                                                key={`${day.toISOString()}-${hour}`}
                                                className="border-r p-1 hover:bg-gray-50 cursor-pointer relative"
                                                onClick={() => handleCellClick(cellDate)}
                                            >
                                                {cellAppointments.map(app => {
                                                    const colorClass = getProfessionalColor(app.professional_name)
                                                    return (
                                                        <div
                                                            key={app.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedAppointment(app)
                                                            }}
                                                            className={`text-xs p-2 rounded mb-1 border-l-2 cursor-pointer hover:shadow-md transition-shadow ${colorClass}`}
                                                        >
                                                            <div className="font-semibold truncate">{app.service_name}</div>
                                                            <div className="truncate opacity-90">{app.conversations?.contact_name || 'Cliente'}</div>
                                                            <div className="text-xs opacity-75">
                                                                {format(parseISO(app.start_time), 'HH:mm')} - {format(parseISO(app.end_time), 'HH:mm')}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Modal de Criação */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Novo Agendamento</DialogTitle>
                        <DialogDescription>
                            {newApptDate && format(newApptDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAppointment} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="time" className="text-right">Horário</Label>
                            <Input
                                id="time"
                                type="time"
                                value={newApptTime}
                                onChange={e => setNewApptTime(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="client" className="text-right">Cliente</Label>
                            <Input
                                id="client"
                                placeholder="Nome do Cliente"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Telefone</Label>
                            <Input
                                id="phone"
                                placeholder="5511999999999"
                                value={clientPhone}
                                onChange={e => setClientPhone(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="service" className="text-right">Serviço</Label>
                            <Select onValueChange={setSelectedServiceId} value={selectedServiceId} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione o serviço" />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} - R$ {s.price}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="professional" className="text-right">Profissional</Label>
                            <Select onValueChange={setSelectedProfId} value={selectedProfId} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione o profissional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {professionals.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={creating}>
                                {creating ? 'Agendando...' : 'Confirmar Agendamento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Detalhes (Mantido igual) */}
            <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes do Agendamento</DialogTitle>
                        <DialogDescription>Informações completas do serviço.</DialogDescription>
                    </DialogHeader>

                    {selectedAppointment && (
                        <div className="space-y-6 py-4">
                            {/* Cabeçalho do Card */}
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getProfessionalColor(selectedAppointment.professional_name).split(' ')[0]} ${getProfessionalColor(selectedAppointment.professional_name).split(' ')[2]}`}>
                                    {selectedAppointment.professional_name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900">{selectedAppointment.service_name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="font-normal">
                                            {selectedAppointment.status === 'scheduled' ? 'Agendado' : selectedAppointment.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 border p-4 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3 text-gray-700">
                                    <User size={20} className="text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Cliente</p>
                                        <p className="font-semibold">{selectedAppointment.conversations?.contact_name || 'Não informado'}</p>
                                        <p className="text-xs text-gray-500">{selectedAppointment.conversations?.remote_jid}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-700">
                                    <CalendarIcon size={20} className="text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Data e Hora</p>
                                        <p className="font-semibold capitalize">
                                            {format(parseISO(selectedAppointment.start_time), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                        </p>
                                        <p className="text-sm">
                                            {format(parseISO(selectedAppointment.start_time), 'HH:mm')} - {format(parseISO(selectedAppointment.end_time), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-700">
                                    <User size={20} className="text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Profissional</p>
                                        <p className="font-semibold">{selectedAppointment.professional_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-700">
                                    <DollarSign size={20} className="text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Valor</p>
                                        <p className="font-semibold text-green-700">R$ {selectedAppointment.price?.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload de Fotos Antes/Depois */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Fotos do Atendimento</h4>
                                <PhotoUploader
                                    appointmentId={selectedAppointment.id}
                                    onPhotosUpdated={() => {
                                        // Recarregar agendamentos se necessário
                                        console.log('Fotos atualizadas')
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedAppointment(null)}
                                >
                                    Fechar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteClick(selectedAppointment)}
                                >
                                    Excluir
                                </Button>
                                <Button
                                    onClick={() => handleEditClick(selectedAppointment)}
                                    className="bg-[#00a884] hover:bg-[#008f6f]"
                                >
                                    Editar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Edição */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Agendamento</DialogTitle>
                        <DialogDescription>Atualize as informações do agendamento.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateAppointment} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-date" className="text-right">Data</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-time" className="text-right">Horário</Label>
                            <Input
                                id="edit-time"
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-service" className="text-right">Serviço</Label>
                            <Select onValueChange={setEditServiceId} value={editServiceId} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione o serviço" />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} - R$ {s.price.toFixed(2)} ({s.duration}min)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-professional" className="text-right">Profissional</Label>
                            <Select onValueChange={setEditProfId} value={editProfId} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione o profissional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {professionals.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updating} className="bg-[#00a884] hover:bg-[#008f6f]">
                                {updating ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>

                    {deletingAppointment && (
                        <div className="py-4 space-y-2">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <p className="text-sm text-gray-600">Cliente</p>
                                <p className="font-semibold">{deletingAppointment.conversations?.contact_name || 'Não informado'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <p className="text-sm text-gray-600">Serviço</p>
                                <p className="font-semibold">{deletingAppointment.service_name}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <p className="text-sm text-gray-600">Data e Hora</p>
                                <p className="font-semibold">
                                    {format(parseISO(deletingAppointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
