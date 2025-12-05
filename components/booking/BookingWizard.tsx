'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { OnlineBookingSettings, Service, Professional, TimeSlot } from '@/types/booking'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { format, addDays, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight, Clock, User, Calendar as CalendarIcon, Scissors } from 'lucide-react'
import { toast } from 'sonner'
import { triggerAutomation } from '@/lib/services/automation'

interface BookingWizardProps {
    settings: OnlineBookingSettings
    unitId: string
}

export function BookingWizard({ settings, unitId }: BookingWizardProps) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Data
    const [services, setServices] = useState<Service[]>([])
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

    // Selections
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Client Info
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [clientEmail, setClientEmail] = useState('')

    // Fetch Services on mount
    useEffect(() => {
        const fetchServices = async () => {
            const { data } = await supabase
                .from('services')
                .select('*')
                .eq('unit_id', unitId)
                .eq('available_online', true)
                .order('name')

            if (data) setServices(data)
        }
        fetchServices()
    }, [unitId])

    // Fetch Professionals when Service is selected (or initially)
    useEffect(() => {
        const fetchProfessionals = async () => {
            // In a real app, we might filter professionals by service
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, photo_url')
                .eq('unit_id', unitId)
                .eq('role', 'professional')

            if (data) setProfessionals(data)
        }
        fetchProfessionals()
    }, [unitId, selectedService])

    // Generate Slots (Mock logic for now - needs real availability check)
    useEffect(() => {
        if (selectedDate && selectedProfessional) {
            // TODO: Real availability check against database
            const slots: TimeSlot[] = []
            for (let i = 9; i < 18; i++) {
                slots.push({ time: `${i}:00`, available: Math.random() > 0.3 })
                slots.push({ time: `${i}:30`, available: Math.random() > 0.3 })
            }
            setAvailableSlots(slots)
        }
    }, [selectedDate, selectedProfessional])

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => s - 1)

    const handleSubmit = async () => {
        if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return

        setLoading(true)
        try {
            // Create Appointment
            const startTime = new Date(selectedDate)
            const [hours, minutes] = selectedTime.split(':')
            startTime.setHours(parseInt(hours), parseInt(minutes))

            const endTime = new Date(startTime.getTime() + selectedService.duration * 60000)

            // ... inside handleSubmit ...

            const { data: newAppointment, error } = await supabase.from('appointments').insert({
                unit_id: unitId,
                service_name: selectedService.name,
                professional_name: selectedProfessional.full_name,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                price: selectedService.price,
                status: settings.auto_confirm ? 'confirmed' : 'pending',
                client_name: clientName,
                client_phone: clientPhone,
                client_email: clientEmail,
                booking_source: 'online'
            }).select().single()

            if (error) throw error

            // 🚀 Disparar Automação
            await triggerAutomation(unitId, 'APPOINTMENT_CREATED', {
                appointment_id: newAppointment.id,
                client_name: clientName,
                client_phone: clientPhone,
                service_name: selectedService.name,
                professional_name: selectedProfessional.full_name,
                start_time: startTime.toISOString(),
                price: selectedService.price
            })

            setStep(5) // Success step
        } catch (error: any) {
            toast.error('Erro ao agendar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    // --- RENDER STEPS ---

    // Step 1: Services
    if (step === 1) {
        return (
            <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Scissors className="w-5 h-5" /> Escolha o Serviço
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {services.map(service => (
                        <Card
                            key={service.id}
                            className={`cursor-pointer hover:border-primary transition-colors ${selectedService?.id === service.id ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => {
                                setSelectedService(service)
                                handleNext()
                            }}
                        >
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">{service.name}</h3>
                                    <p className="text-sm text-gray-500">{service.duration} min</p>
                                </div>
                                <div className="font-semibold text-primary">
                                    R$ {service.price.toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // Step 2: Professionals
    if (step === 2) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 w-4 h-4" /> Voltar</Button>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <User className="w-5 h-5" /> Escolha o Profissional
                    </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {professionals.map(prof => (
                        <Card
                            key={prof.id}
                            className={`cursor-pointer hover:border-primary transition-colors ${selectedProfessional?.id === prof.id ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => {
                                setSelectedProfessional(prof)
                                handleNext()
                            }}
                        >
                            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                                    {prof.photo_url ? (
                                        <img src={prof.photo_url} alt={prof.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 m-4 text-gray-400" />
                                    )}
                                </div>
                                <h3 className="font-medium">{prof.full_name}</h3>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // Step 3: Date & Time
    if (step === 3) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 w-4 h-4" /> Voltar</Button>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" /> Escolha Data e Horário
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={ptBR}
                            disabled={(date: Date) => date < new Date() || date > addDays(new Date(), settings.max_advance_days)}
                            className="rounded-md border shadow"
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">Horários Disponíveis</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map((slot, i) => (
                                <Button
                                    key={i}
                                    variant={selectedTime === slot.time ? 'default' : 'outline'}
                                    disabled={!slot.available}
                                    onClick={() => setSelectedTime(slot.time)}
                                    className={!slot.available ? 'opacity-50' : ''}
                                >
                                    {slot.time}
                                </Button>
                            ))}
                        </div>
                        {availableSlots.length === 0 && (
                            <p className="text-gray-500 text-sm">Selecione uma data para ver horários.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button disabled={!selectedDate || !selectedTime} onClick={handleNext}>
                        Continuar <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        )
    }

    // Step 4: Identification
    if (step === 4) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" onClick={handleBack}><ChevronLeft className="mr-1 w-4 h-4" /> Voltar</Button>
                    <h2 className="text-xl font-semibold">Seus Dados</h2>
                </div>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <Label>Nome Completo</Label>
                            <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Maria Silva" />
                        </div>
                        <div>
                            <Label>Telefone / WhatsApp</Label>
                            <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
                        </div>
                        <div>
                            <Label>Email (Opcional)</Label>
                            <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="maria@email.com" />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-2 text-sm">
                            <p><strong>Resumo do Agendamento:</strong></p>
                            <p>✂️ {selectedService?.name} - R$ {selectedService?.price.toFixed(2)}</p>
                            <p>👤 {selectedProfessional?.full_name}</p>
                            <p>📅 {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button
                        disabled={!clientName || !clientPhone || loading}
                        onClick={handleSubmit}
                        className="w-full md:w-auto"
                    >
                        {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                    </Button>
                </div>
            </div>
        )
    }

    // Step 5: Success
    if (step === 5) {
        return (
            <div className="text-center space-y-6 py-12">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Agendamento Confirmado!</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                    Obrigado, {clientName}. Seu horário para <strong>{selectedService?.name}</strong> está reservado.
                </p>
                <div className="pt-8">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Fazer novo agendamento
                    </Button>
                </div>
            </div>
        )
    }

    return null
}
