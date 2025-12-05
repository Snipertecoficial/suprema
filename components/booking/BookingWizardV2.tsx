'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { OnlineBookingSettings, Service, ProfessionalWithService, TimeSlot, EXPERTISE_BADGES } from '@/types/booking'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight, Clock, User, Calendar as CalendarIcon, Scissors, Star, Award, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface BookingWizardV2Props {
    settings: OnlineBookingSettings
    unitId: string
}

export function BookingWizardV2({ settings, unitId }: BookingWizardV2Props) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Data
    const [services, setServices] = useState<Service[]>([])
    const [professionals, setProfessionals] = useState<ProfessionalWithService[]>([])
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

    // Selections
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalWithService | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Client Info
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [clientEmail, setClientEmail] = useState('')

    // Aplicar cores personalizadas
    const customStyles = {
        '--primary-color': settings.primary_color,
        '--secondary-color': settings.secondary_color,
        '--accent-color': settings.accent_color,
        '--background-color': settings.background_color,
        '--text-color': settings.text_color,
    } as React.CSSProperties

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

    // Fetch Professionals when Service is selected
    useEffect(() => {
        if (!selectedService) return

        const fetchProfessionals = async () => {
            setLoading(true)
            try {
                // Usar a função SQL para buscar profissionais por serviço
                const { data, error } = await supabase
                    .rpc('get_professionals_by_service', {
                        p_service_id: selectedService.id,
                        p_unit_id: unitId
                    })

                if (error) {
                    console.error('Erro ao buscar profissionais:', error)
                    toast.error('Erro ao carregar profissionais')
                    return
                }

                if (data && data.length > 0) {
                    setProfessionals(data)
                } else {
                    // Fallback: buscar todos os profissionais se a função não retornar nada
                    const { data: allProfs } = await supabase
                        .from('profiles')
                        .select('id, full_name, photo_url, rating, total_reviews, total_appointments_completed, is_featured, display_order')
                        .eq('unit_id', unitId)
                        .eq('role', 'professional')
                        .order('display_order', { ascending: true })

                    if (allProfs) {
                        // Adicionar campos padrão
                        setProfessionals(allProfs.map(p => ({
                            ...p,
                            expertise_level: 'intermediate' as const,
                            custom_price: null,
                            custom_duration: null
                        })))
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar profissionais:', error)
                toast.error('Erro ao carregar profissionais')
            } finally {
                setLoading(false)
            }
        }

        fetchProfessionals()
    }, [selectedService, unitId])

    // Fetch Available Slots when Professional and Date are selected
    useEffect(() => {
        if (!selectedProfessional || !selectedDate) return

        const fetchAvailableSlots = async () => {
            setLoading(true)
            try {
                const duration = selectedProfessional.custom_duration || selectedService?.duration || 60

                const { data, error } = await supabase
                    .rpc('get_available_slots', {
                        p_professional_id: selectedProfessional.id,
                        p_date: format(selectedDate, 'yyyy-MM-dd'),
                        p_service_duration: duration,
                        p_unit_id: unitId,
                        p_slot_interval: settings.slot_interval_minutes
                    })

                if (error) {
                    console.error('Erro ao buscar horários:', error)
                    toast.error('Erro ao carregar horários disponíveis')
                    return
                }

                if (data) {
                    setAvailableSlots(data.map(slot => ({
                        time: slot.slot_time.substring(0, 5), // '09:00:00' -> '09:00'
                        available: slot.is_available
                    })))
                } else {
                    setAvailableSlots([])
                }
            } catch (error) {
                console.error('Erro ao buscar horários:', error)
                toast.error('Erro ao carregar horários')
            } finally {
                setLoading(false)
            }
        }

        fetchAvailableSlots()
    }, [selectedProfessional, selectedDate, selectedService, unitId, settings.slot_interval_minutes])

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => {
        setStep(s => s - 1)
        // Reset selections ao voltar
        if (step === 3) setSelectedTime(null)
    }

    const handleSubmit = async () => {
        if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return

        setLoading(true)
        try {
            // Create Appointment
            const startTime = new Date(selectedDate)
            const [hours, minutes] = selectedTime.split(':')
            startTime.setHours(parseInt(hours), parseInt(minutes))

            const duration = selectedProfessional.custom_duration || selectedService.duration
            const price = selectedProfessional.custom_price || selectedService.price
            const endTime = new Date(startTime.getTime() + duration * 60000)

            const { error } = await supabase.from('appointments').insert({
                unit_id: unitId,
                professional_id: selectedProfessional.id,
                service_id: selectedService.id,
                service_name: selectedService.name,
                professional_name: selectedProfessional.full_name,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                price: price,
                status: settings.auto_confirm ? 'confirmed' : 'pending',
                client_name: clientName,
                client_phone: clientPhone,
                client_email: clientEmail,
                booking_source: 'online'
            })

            if (error) throw error

            setStep(5) // Success step
        } catch (error: any) {
            toast.error('Erro ao agendar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const getPriceDisplay = (prof: ProfessionalWithService) => {
        const price = prof.custom_price || selectedService?.price || 0
        return `R$ ${price.toFixed(2)}`
    }

    const getDurationDisplay = (prof: ProfessionalWithService) => {
        const duration = prof.custom_duration || selectedService?.duration || 0
        return `${duration} min`
    }

    // --- RENDER STEPS ---

    // Step 1: Services
    if (step === 1) {
        return (
            <div className="space-y-6" style={customStyles}>
                {settings.welcome_message && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100">
                        <p className="text-gray-700">{settings.welcome_message}</p>
                    </div>
                )}

                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: settings.text_color }}>
                    <Scissors className="w-6 h-6" style={{ color: settings.primary_color }} />
                    Escolha o Serviço
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {services.map(service => (
                        <Card
                            key={service.id}
                            className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2"
                            style={{
                                borderColor: selectedService?.id === service.id ? settings.primary_color : '#e5e7eb'
                            }}
                            onClick={() => {
                                setSelectedService(service)
                                handleNext()
                            }}
                        >
                            <CardContent className="p-6">
                                {service.photo_url && (
                                    <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={service.photo_url}
                                            alt={service.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{service.name}</h3>
                                    <div className="text-right">
                                        <div className="font-bold text-lg" style={{ color: settings.primary_color }}>
                                            R$ {service.price.toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {service.duration} min
                                        </div>
                                    </div>
                                </div>
                                {service.description && (
                                    <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                                )}
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
            <div className="space-y-6" style={customStyles}>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="hover:bg-gray-100"
                    >
                        <ChevronLeft className="mr-1 w-4 h-4" /> Voltar
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: settings.text_color }}>
                            <User className="w-6 h-6" style={{ color: settings.primary_color }} />
                            Escolha o Profissional
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Para {selectedService?.name}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: settings.primary_color }}></div>
                        <p className="text-gray-500 mt-4">Carregando profissionais...</p>
                    </div>
                ) : professionals.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nenhum profissional disponível para este serviço.</p>
                        <Button variant="outline" onClick={handleBack} className="mt-4">
                            Escolher outro serviço
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {professionals.map(prof => (
                            <Card
                                key={prof.id}
                                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 relative"
                                style={{
                                    borderColor: selectedProfessional?.id === prof.id ? settings.primary_color : '#e5e7eb'
                                }}
                                onClick={() => {
                                    setSelectedProfessional(prof)
                                    handleNext()
                                }}
                            >
                                {prof.is_featured && (
                                    <div
                                        className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                                        style={{ backgroundColor: settings.accent_color, color: 'white' }}
                                    >
                                        <Star className="w-3 h-3 fill-current" />
                                        Destaque
                                    </div>
                                )}

                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    {settings.show_professional_photos && (
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 ring-4 ring-offset-2"
                                            style={{ ringColor: prof.is_featured ? settings.accent_color : '#e5e7eb' }}>
                                            {prof.photo_url ? (
                                                <img src={prof.photo_url} alt={prof.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-12 h-12 m-6 text-gray-400" />
                                            )}
                                        </div>
                                    )}

                                    <div className="w-full">
                                        <h3 className="font-bold text-lg mb-2">{prof.full_name}</h3>

                                        {settings.show_professional_expertise && (
                                            <div className="flex justify-center mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${EXPERTISE_BADGES[prof.expertise_level].color}`}>
                                                    {EXPERTISE_BADGES[prof.expertise_level].label}
                                                </span>
                                            </div>
                                        )}

                                        {prof.rating > 0 && (
                                            <div className="flex items-center justify-center gap-2 text-sm mb-2">
                                                <div className="flex items-center gap-1" style={{ color: settings.accent_color }}>
                                                    <Star className="w-4 h-4 fill-current" />
                                                    <span className="font-semibold">{prof.rating.toFixed(1)}</span>
                                                </div>
                                                <span className="text-gray-500">
                                                    ({prof.total_reviews} avaliações)
                                                </span>
                                            </div>
                                        )}

                                        {prof.total_appointments_completed > 0 && (
                                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-3">
                                                <Award className="w-3 h-3" />
                                                <span>{prof.total_appointments_completed} atendimentos realizados</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="text-sm">
                                                <div className="font-bold" style={{ color: settings.primary_color }}>
                                                    {getPriceDisplay(prof)}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    {getDurationDisplay(prof)}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                style={{
                                                    backgroundColor: settings.primary_color,
                                                    color: 'white'
                                                }}
                                            >
                                                Selecionar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Step 3: Date & Time
    if (step === 3) {
        return (
            <div className="space-y-6" style={customStyles}>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="hover:bg-gray-100"
                    >
                        <ChevronLeft className="mr-1 w-4 h-4" /> Voltar
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: settings.text_color }}>
                            <CalendarIcon className="w-6 h-6" style={{ color: settings.primary_color }} />
                            Escolha Data e Horário
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {selectedService?.name} com {selectedProfessional?.full_name}
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={ptBR}
                            disabled={(date: Date) =>
                                date < new Date() ||
                                date > addDays(new Date(), settings.max_advance_days)
                            }
                            className="rounded-md border shadow"
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Horários Disponíveis
                        </h3>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: settings.primary_color }}></div>
                                <p className="text-gray-500 mt-2 text-sm">Verificando disponibilidade...</p>
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <p className="text-gray-500 text-sm py-8 text-center">
                                Nenhum horário disponível para esta data. Tente outra data.
                            </p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
                                {availableSlots.map((slot, i) => (
                                    <Button
                                        key={i}
                                        variant={selectedTime === slot.time ? 'default' : 'outline'}
                                        disabled={!slot.available}
                                        onClick={() => setSelectedTime(slot.time)}
                                        className="h-12"
                                        style={
                                            selectedTime === slot.time
                                                ? { backgroundColor: settings.primary_color, color: 'white' }
                                                : {}
                                        }
                                    >
                                        {slot.time}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        disabled={!selectedDate || !selectedTime}
                        onClick={handleNext}
                        style={{ backgroundColor: settings.primary_color, color: 'white' }}
                    >
                        Continuar <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        )
    }

    // Step 4: Client Info
    if (step === 4) {
        return (
            <div className="space-y-6" style={customStyles}>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="hover:bg-gray-100"
                    >
                        <ChevronLeft className="mr-1 w-4 h-4" /> Voltar
                    </Button>
                    <h2 className="text-2xl font-bold" style={{ color: settings.text_color }}>
                        Seus Dados
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input
                                    id="name"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    placeholder="Ex: Maria Silva"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                                <Input
                                    id="phone"
                                    value={clientPhone}
                                    onChange={e => setClientPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email (Opcional)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={clientEmail}
                                    onChange={e => setClientEmail(e.target.value)}
                                    placeholder="maria@email.com"
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card style={{ borderColor: settings.primary_color, borderWidth: 2 }}>
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: settings.primary_color }}>
                                <Check className="w-5 h-5" />
                                Resumo do Agendamento
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3 pb-3 border-b">
                                    <Scissors className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: settings.primary_color }} />
                                    <div>
                                        <div className="font-semibold">{selectedService?.name}</div>
                                        <div className="text-gray-600">
                                            {selectedProfessional && getPriceDisplay(selectedProfessional)} • {selectedProfessional && getDurationDisplay(selectedProfessional)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pb-3 border-b">
                                    <User className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: settings.primary_color }} />
                                    <div>
                                        <div className="font-semibold">{selectedProfessional?.full_name}</div>
                                        {selectedProfessional && settings.show_professional_expertise && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                {EXPERTISE_BADGES[selectedProfessional.expertise_level].label}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CalendarIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: settings.primary_color }} />
                                    <div>
                                        <div className="font-semibold">
                                            {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                        </div>
                                        <div className="text-gray-600">às {selectedTime}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <span style={{ color: settings.primary_color }}>
                                        {selectedProfessional && getPriceDisplay(selectedProfessional)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        disabled={!clientName || !clientPhone || loading}
                        onClick={handleSubmit}
                        size="lg"
                        className="px-8"
                        style={{ backgroundColor: settings.primary_color, color: 'white' }}
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
            <div className="text-center space-y-6 py-12" style={customStyles}>
                <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: `${settings.primary_color}20` }}
                >
                    <Check className="w-12 h-12" style={{ color: settings.primary_color }} />
                </div>

                <h2 className="text-3xl font-bold" style={{ color: settings.text_color }}>
                    {settings.auto_confirm ? 'Agendamento Confirmado!' : 'Solicitação Recebida!'}
                </h2>

                <div className="max-w-md mx-auto space-y-4">
                    {settings.confirmation_message ? (
                        <p className="text-gray-600">{settings.confirmation_message}</p>
                    ) : (
                        <>
                            <p className="text-gray-600">
                                Obrigado, <strong>{clientName}</strong>!
                            </p>
                            <p className="text-gray-600">
                                Seu horário para <strong>{selectedService?.name}</strong> com{' '}
                                <strong>{selectedProfessional?.full_name}</strong> foi{' '}
                                {settings.auto_confirm ? 'confirmado' : 'solicitado'}.
                            </p>
                            {!settings.auto_confirm && (
                                <p className="text-sm text-gray-500">
                                    Você receberá uma confirmação em breve via WhatsApp.
                                </p>
                            )}
                        </>
                    )}

                    <Card className="mt-6">
                        <CardContent className="p-4 text-left text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Data:</span>
                                <span className="font-semibold">
                                    {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Horário:</span>
                                <span className="font-semibold">{selectedTime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Profissional:</span>
                                <span className="font-semibold">{selectedProfessional?.full_name}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="pt-8">
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        size="lg"
                        style={{ borderColor: settings.primary_color, color: settings.primary_color }}
                    >
                        Fazer novo agendamento
                    </Button>
                </div>
            </div>
        )
    }

    return null
}
