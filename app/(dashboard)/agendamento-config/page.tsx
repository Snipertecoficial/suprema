'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Save, ExternalLink, Copy } from 'lucide-react'
import { OnlineBookingSettings } from '@/types/booking'

export default function AgendamentoConfigPage() {
    const supabase = createClient()
    const { profile, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<Partial<OnlineBookingSettings>>({})

    useEffect(() => {
        if (authLoading) return

        if (profile?.unit_id) {
            fetchSettings()
        } else {
            setLoading(false)
        }
    }, [profile?.unit_id, authLoading])

    const fetchSettings = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('online_booking_settings')
            .select('*')
            .eq('unit_id', profile?.unit_id)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            toast.error('Erro ao carregar configurações')
            console.error(error)
        } else if (data) {
            setSettings(data)
        } else {
            // Defaults if not found
            setSettings({
                is_enabled: true,
                slug: `agendamento-${profile?.unit_id?.slice(0, 8)}`,
                page_title: 'Agende seu Horário',
                page_description: 'Selecione o serviço e profissional de sua preferência.',
                min_advance_hours: 2,
                max_advance_days: 30,
                slot_interval_minutes: 30,
                auto_confirm: false,
                require_phone_verification: false
            })
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!profile?.unit_id) return
        setSaving(true)

        try {
            const dataToSave = {
                ...settings,
                unit_id: profile.unit_id,
                updated_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('online_booking_settings')
                .upsert(dataToSave)

            if (error) throw error

            toast.success('Configurações salvas com sucesso!')
            fetchSettings() // Reload to get ID if it was an insert
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const copyLink = () => {
        const url = `${window.location.origin}/agendamento`
        navigator.clipboard.writeText(url)
        toast.success('Link copiado!')
    }

    if (loading) {
        return <div className="p-8">Carregando...</div>
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agendamento Online</h1>
                    <p className="text-gray-500 mt-1">Configure sua página pública de agendamento</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Link Público */}
                <Card className="md:col-span-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100">
                    <CardHeader>
                        <CardTitle className="text-purple-900">Seu Link de Agendamento</CardTitle>
                        <CardDescription className="text-purple-700">
                            Compartilhe este link com seus clientes para que eles possam agendar online.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Input
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/agendamento`}
                            readOnly
                            className="bg-white"
                        />
                        <Button variant="outline" onClick={copyLink} className="gap-2">
                            <Copy className="w-4 h-4" />
                            Copiar
                        </Button>
                        <Button variant="default" onClick={() => window.open('/agendamento', '_blank')} className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Abrir
                        </Button>
                    </CardContent>
                </Card>

                {/* Configurações Gerais */}
                <Card>
                    <CardHeader>
                        <CardTitle>Geral</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Habilitar Agendamento Online</Label>
                                <p className="text-sm text-gray-500">Permitir que clientes acessem a página</p>
                            </div>
                            <Switch
                                checked={settings.is_enabled}
                                onCheckedChange={c => setSettings(s => ({ ...s, is_enabled: c }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Confirmação Automática</Label>
                                <p className="text-sm text-gray-500">Agendamentos são confirmados automaticamente</p>
                            </div>
                            <Switch
                                checked={settings.auto_confirm}
                                onCheckedChange={c => setSettings(s => ({ ...s, auto_confirm: c }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Aparência e Conteúdo */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Aparência e Conteúdo</CardTitle>
                        <CardDescription>Personalize as cores, logo e textos da página de agendamento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Título da Página</Label>
                                <Input
                                    value={settings.page_title || ''}
                                    onChange={e => setSettings(s => ({ ...s, page_title: e.target.value }))}
                                    placeholder="Ex: Agende seu horário"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL do Logo</Label>
                                <Input
                                    value={settings.logo_url || ''}
                                    onChange={e => setSettings(s => ({ ...s, logo_url: e.target.value }))}
                                    placeholder="https://exemplo.com/logo.png"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                                value={settings.page_description || ''}
                                onChange={e => setSettings(s => ({ ...s, page_description: e.target.value }))}
                                placeholder="Escolha o serviço e profissional de sua preferência"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Mensagem de Boas-vindas (opcional)</Label>
                            <Textarea
                                value={settings.welcome_message || ''}
                                onChange={e => setSettings(s => ({ ...s, welcome_message: e.target.value }))}
                                placeholder="Mensagem exibida no início do agendamento"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Mensagem de Confirmação (opcional)</Label>
                            <Textarea
                                value={settings.confirmation_message || ''}
                                onChange={e => setSettings(s => ({ ...s, confirmation_message: e.target.value }))}
                                placeholder="Mensagem exibida após o agendamento"
                                rows={2}
                            />
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-4">Cores do Sistema</h4>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Cor Primária</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.primary_color || '#8B5CF6'}
                                            onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                                            className="w-20 h-10 p-1"
                                        />
                                        <Input
                                            value={settings.primary_color || '#8B5CF6'}
                                            onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                                            placeholder="#8B5CF6"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor Secundária</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.secondary_color || '#6B7280'}
                                            onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))}
                                            className="w-20 h-10 p-1"
                                        />
                                        <Input
                                            value={settings.secondary_color || '#6B7280'}
                                            onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))}
                                            placeholder="#6B7280"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor de Destaque</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.accent_color || '#EC4899'}
                                            onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))}
                                            className="w-20 h-10 p-1"
                                        />
                                        <Input
                                            value={settings.accent_color || '#EC4899'}
                                            onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))}
                                            placeholder="#EC4899"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor de Fundo</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.background_color || '#FFFFFF'}
                                            onChange={e => setSettings(s => ({ ...s, background_color: e.target.value }))}
                                            className="w-20 h-10 p-1"
                                        />
                                        <Input
                                            value={settings.background_color || '#FFFFFF'}
                                            onChange={e => setSettings(s => ({ ...s, background_color: e.target.value }))}
                                            placeholder="#FFFFFF"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor do Texto</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.text_color || '#1F2937'}
                                            onChange={e => setSettings(s => ({ ...s, text_color: e.target.value }))}
                                            className="w-20 h-10 p-1"
                                        />
                                        <Input
                                            value={settings.text_color || '#1F2937'}
                                            onChange={e => setSettings(s => ({ ...s, text_color: e.target.value }))}
                                            placeholder="#1F2937"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Mostrar Fotos dos Profissionais</Label>
                                    <p className="text-sm text-gray-500">Exibe foto dos profissionais na seleção</p>
                                </div>
                                <Switch
                                    checked={settings.show_professional_photos ?? true}
                                    onCheckedChange={c => setSettings(s => ({ ...s, show_professional_photos: c }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Mostrar Nível de Especialização</Label>
                                <p className="text-sm text-gray-500">Exibe badges de especialização dos profissionais</p>
                            </div>
                            <Switch
                                checked={settings.show_professional_expertise ?? true}
                                onCheckedChange={c => setSettings(s => ({ ...s, show_professional_expertise: c }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Regras de Horário */}
                <Card>
                    <CardHeader>
                        <CardTitle>Regras de Horário</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Antecedência Mínima (horas)</Label>
                                <Input
                                    type="number"
                                    value={settings.min_advance_hours}
                                    onChange={e => setSettings(s => ({ ...s, min_advance_hours: parseInt(e.target.value) }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Agenda Aberta (dias)</Label>
                                <Input
                                    type="number"
                                    value={settings.max_advance_days}
                                    onChange={e => setSettings(s => ({ ...s, max_advance_days: parseInt(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Intervalo entre Horários (minutos)</Label>
                            <Input
                                type="number"
                                step="15"
                                value={settings.slot_interval_minutes}
                                onChange={e => setSettings(s => ({ ...s, slot_interval_minutes: parseInt(e.target.value) }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
