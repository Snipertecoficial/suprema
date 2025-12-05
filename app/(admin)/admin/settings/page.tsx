'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface SystemSettings {
    gemini_api_key_master: string
    evolution_api_global_token: string
    maintenance_mode: boolean
}

export default function GlobalSettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({
        gemini_api_key_master: '',
        evolution_api_global_token: '',
        maintenance_mode: false,
    })
    const [showGeminiKey, setShowGeminiKey] = useState(false)
    const [showEvolutionToken, setShowEvolutionToken] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .single()

            if (data) {
                setSettings({
                    gemini_api_key_master: data.gemini_api_key_master || '',
                    evolution_api_global_token: data.evolution_api_global_token || '',
                    maintenance_mode: data.maintenance_mode || false,
                })
            }
            setLoading(false)
        } catch (error) {
            console.error('Error loading settings:', error)
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            // Tentar atualizar primeiro
            const { error: updateError } = await supabase
                .from('system_settings')
                .update({
                    gemini_api_key_master: settings.gemini_api_key_master,
                    evolution_api_global_token: settings.evolution_api_global_token,
                    maintenance_mode: settings.maintenance_mode,
                })
                .eq('id', 1) // Assumindo que existe uma linha com id = 1

            if (updateError) {
                // Se não existir, inserir
                const { error: insertError } = await supabase
                    .from('system_settings')
                    .insert({
                        id: 1,
                        gemini_api_key_master: settings.gemini_api_key_master,
                        evolution_api_global_token: settings.evolution_api_global_token,
                        maintenance_mode: settings.maintenance_mode,
                    })

                if (insertError) throw insertError
            }

            alert('Configurações salvas com sucesso!')
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('Erro ao salvar configurações. Verifique o console.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="text-white">Carregando configurações...</div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold text-white">Configurações Globais</h1>
                <p className="text-zinc-400 mt-2">
                    Gerencie as chaves de API e configurações do sistema
                </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
                {/* Gemini API Key */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Gemini API Key (Master)
                    </label>
                    <div className="relative">
                        <input
                            type={showGeminiKey ? 'text' : 'password'}
                            value={settings.gemini_api_key_master}
                            onChange={(e) =>
                                setSettings({ ...settings, gemini_api_key_master: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 pr-12"
                            placeholder="AIzaSy..."
                        />
                        <button
                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            {showGeminiKey ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-zinc-500 mt-2">
                        Chave mestra para o Google Gemini AI (usada em todas as units)
                    </p>
                </div>

                {/* Evolution API Token */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Evolution API Global Token
                    </label>
                    <div className="relative">
                        <input
                            type={showEvolutionToken ? 'text' : 'password'}
                            value={settings.evolution_api_global_token}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    evolution_api_global_token: e.target.value,
                                })
                            }
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 pr-12"
                            placeholder="B6D1F7E9-..."
                        />
                        <button
                            onClick={() => setShowEvolutionToken(!showEvolutionToken)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            {showEvolutionToken ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-zinc-500 mt-2">
                        Token global para gerenciar instâncias Evolution API
                    </p>
                </div>

                {/* Maintenance Mode */}
                <div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <div>
                                <p className="text-white font-medium">Modo de Manutenção</p>
                                <p className="text-sm text-zinc-400">
                                    Bloqueia acesso ao sistema para todos os tenants
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode}
                                onChange={(e) =>
                                    setSettings({ ...settings, maintenance_mode: e.target.checked })
                                }
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    )
}
