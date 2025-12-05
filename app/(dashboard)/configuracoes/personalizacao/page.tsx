'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Save, Palette, Eye, Upload, Loader2 } from 'lucide-react'

export default function PersonalizacaoPage() {
    const supabase = createClient()
    const { profile, loading: authLoading } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [settings, setSettings] = useState({
        logo_url: '',
        brand_name: 'Beto Style',
        primary_color: '#8B5CF6',
        secondary_color: '#6B7280',
        accent_color: '#EC4899',
        sidebar_bg_color: '#FFFFFF',
        custom_css: ''
    })

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
            .from('units')
            .select('logo_url, brand_name, primary_color, secondary_color, accent_color, sidebar_bg_color, custom_css')
            .eq('id', profile?.unit_id)
            .single()

        if (error) {
            console.error('Erro ao carregar configurações:', error)
            toast.error('Erro ao carregar configurações')
        } else if (data) {
            setSettings({
                logo_url: data.logo_url || '',
                brand_name: data.brand_name || 'Beto Style',
                primary_color: data.primary_color || '#8B5CF6',
                secondary_color: data.secondary_color || '#6B7280',
                accent_color: data.accent_color || '#EC4899',
                sidebar_bg_color: data.sidebar_bg_color || '#FFFFFF',
                custom_css: data.custom_css || ''
            })
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!profile?.unit_id) return
        setSaving(true)

        try {
            const { error } = await supabase
                .from('units')
                .update(settings)
                .eq('id', profile.unit_id)

            if (error) throw error

            toast.success('Configurações salvas! Recarregue a página para ver as mudanças.')
        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            toast.error('Erro ao salvar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !profile?.unit_id) return

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione uma imagem válida')
            return
        }

        // Validar tamanho (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Imagem muito grande. Máximo: 2MB')
            return
        }

        setUploading(true)

        try {
            // Nome único para o arquivo
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.unit_id}/logo-${Date.now()}.${fileExt}`

            // Upload para Supabase Storage
            const { data, error } = await supabase.storage
                .from('logos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (error) throw error

            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(fileName)

            // Atualizar settings
            setSettings(s => ({ ...s, logo_url: publicUrl }))
            toast.success('Logo enviado com sucesso!')

        } catch (error: any) {
            console.error('Erro ao fazer upload:', error)
            toast.error('Erro ao fazer upload: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const reloadPage = () => {
        window.location.reload()
    }

    if (loading) {
        return <div className="p-8">Carregando...</div>
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Personalização Visual</h1>
                    <p className="text-gray-500 mt-1">Configure a aparência do CRM com a identidade da sua marca</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={reloadPage}>
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar Mudanças
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Identidade Visual */}
                <Card>
                    <CardHeader>
                        <CardTitle>Identidade Visual</CardTitle>
                        <CardDescription>Logo e nome da marca</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand_name">Nome da Marca</Label>
                            <Input
                                id="brand_name"
                                value={settings.brand_name}
                                onChange={e => setSettings(s => ({ ...s, brand_name: e.target.value }))}
                                placeholder="Ex: Beto Style"
                            />
                            <p className="text-xs text-gray-500">Aparece na sidebar e em todo o sistema</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Logo da Marca</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex-1"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload de Imagem
                                        </>
                                    )}
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Recomendado: PNG transparente, 200x200px, máximo 2MB
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logo_url">Ou Cole URL do Logo</Label>
                            <Input
                                id="logo_url"
                                value={settings.logo_url}
                                onChange={e => setSettings(s => ({ ...s, logo_url: e.target.value }))}
                                placeholder="https://exemplo.com/logo.png"
                            />
                        </div>

                        {settings.logo_url && (
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <p className="text-sm font-medium mb-2">Preview do Logo:</p>
                                <img
                                    src={settings.logo_url}
                                    alt="Logo Preview"
                                    className="h-16 w-auto"
                                    onError={(e) => {
                                        e.currentTarget.src = ''
                                        toast.error('Erro ao carregar logo. Verifique a URL.')
                                    }}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cores do Sistema */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Cores do Sistema
                        </CardTitle>
                        <CardDescription>Personalize a paleta de cores</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary_color">Cor Primária (Botões, Links)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="primary_color"
                                    value={settings.primary_color}
                                    onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                                    className="w-20 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={settings.primary_color}
                                    onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                                    placeholder="#8B5CF6"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="secondary_color">Cor Secundária (Textos, Ícones)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="secondary_color"
                                    value={settings.secondary_color}
                                    onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))}
                                    className="w-20 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={settings.secondary_color}
                                    onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))}
                                    placeholder="#6B7280"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="accent_color">Cor de Destaque (Notificações, Badges)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="accent_color"
                                    value={settings.accent_color}
                                    onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))}
                                    className="w-20 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={settings.accent_color}
                                    onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))}
                                    placeholder="#EC4899"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sidebar_bg_color">Cor de Fundo da Sidebar</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="sidebar_bg_color"
                                    value={settings.sidebar_bg_color}
                                    onChange={e => setSettings(s => ({ ...s, sidebar_bg_color: e.target.value }))}
                                    className="w-20 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={settings.sidebar_bg_color}
                                    onChange={e => setSettings(s => ({ ...s, sidebar_bg_color: e.target.value }))}
                                    placeholder="#FFFFFF"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview de Cores */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preview das Cores</CardTitle>
                        <CardDescription>Veja como as cores ficarão</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="p-4 rounded-lg border-2" style={{ backgroundColor: settings.sidebar_bg_color }}>
                                <p className="text-sm font-medium mb-2" style={{ color: settings.primary_color }}>
                                    {settings.brand_name || 'Sua Marca'}
                                </p>
                                <p className="text-xs" style={{ color: settings.secondary_color }}>
                                    CRM Profissional
                                </p>
                            </div>

                            <Button
                                className="w-full"
                                style={{
                                    backgroundColor: settings.primary_color,
                                    color: 'white'
                                }}
                            >
                                Botão Primário
                            </Button>

                            <div className="flex gap-2">
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: `${settings.accent_color}20`,
                                        color: settings.accent_color
                                    }}
                                >
                                    Badge Destaque
                                </span>
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: `${settings.secondary_color}20`,
                                        color: settings.secondary_color
                                    }}
                                >
                                    Badge Secundário
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CSS Customizado (Avançado) */}
                <Card>
                    <CardHeader>
                        <CardTitle>CSS Customizado (Avançado)</CardTitle>
                        <CardDescription>Adicione estilos personalizados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={settings.custom_css}
                            onChange={e => setSettings(s => ({ ...s, custom_css: e.target.value }))}
                            placeholder={`:root {\n  --custom-variable: #000000;\n}\n\n.my-custom-class {\n  color: var(--custom-variable);\n}`}
                            rows={8}
                            className="font-mono text-xs"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            ⚠️ Atenção: CSS customizado pode afetar a aparência do sistema. Use com cuidado.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
