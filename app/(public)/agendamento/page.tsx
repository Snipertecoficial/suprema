'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { OnlineBookingSettings } from '@/types/booking'
import { BookingWizardV2 } from '@/components/booking/BookingWizardV2'
import { Loader2 } from 'lucide-react'

export default function BookingPage() {
    const [settings, setSettings] = useState<OnlineBookingSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch the first available booking settings (assuming single unit for now)
                const { data, error } = await supabase
                    .from('online_booking_settings')
                    .select('*')
                    .eq('is_enabled', true)
                    .limit(1)
                    .single()

                if (error) throw error
                setSettings(data)
            } catch (err: any) {
                console.error('Error fetching booking settings:', err)
                setError('Agendamento online não disponível no momento.')
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !settings) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h1>
                    <p className="text-gray-600">{error || 'Página de agendamento não encontrada.'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    {settings.logo_url && (
                        <div className="flex justify-center mb-6">
                            <img
                                src={settings.logo_url}
                                alt="Logo"
                                className="h-20 w-auto"
                            />
                        </div>
                    )}
                    {settings.banner_url && (
                        <img
                            src={settings.banner_url}
                            alt="Banner"
                            className="w-full h-48 object-cover rounded-lg mb-6 shadow-sm"
                        />
                    )}
                    <h1 className="text-4xl font-bold" style={{ color: settings.text_color }}>
                        {settings.page_title || 'Agendamento Online'}
                    </h1>
                    {settings.page_description && (
                        <p className="mt-3 text-lg" style={{ color: settings.secondary_color }}>
                            {settings.page_description}
                        </p>
                    )}
                </div>

                <div className="bg-white shadow-xl rounded-lg overflow-hidden" style={{
                    backgroundColor: settings.background_color,
                    borderColor: settings.primary_color,
                    borderWidth: '2px'
                }}>
                    <div className="p-6 sm:p-10">
                        <BookingWizardV2 settings={settings} unitId={settings.unit_id} />
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-gray-400">
                    <p>Powered by Agente Beto Style</p>
                </div>
            </div>
        </div>
    )
}
