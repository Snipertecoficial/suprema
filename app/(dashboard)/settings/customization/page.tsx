'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTenant } from '@/components/providers/TenantProvider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Save, Upload } from 'lucide-react'

export default function CustomizationPage() {
    const { profile } = useAuth()
    const { tenant, refreshTenant } = useTenant()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        business_name: '',
        brand_primary_color: '#00a884',
        brand_secondary_color: '#005c4b',
        logo_url: ''
    })

    useEffect(() => {
        if (tenant) {
            setFormData({
                business_name: tenant.business_name || tenant.name || '',
                brand_primary_color: tenant.brand_primary_color || '#00a884',
                brand_secondary_color: tenant.brand_secondary_color || '#005c4b',
                logo_url: tenant.logo_url || ''
            })
        }
    }, [tenant])

    const handleSave = async () => {
        if (!profile?.unit_id) return
        setLoading(true)

        try {
            const { error } = await supabase
                .from('units')
                .update({
                    business_name: formData.business_name,
                    brand_primary_color: formData.brand_primary_color,
                    brand_secondary_color: formData.brand_secondary_color,
                    logo_url: formData.logo_url
                })
                .eq('id', profile.unit_id)

            if (error) throw error

            toast.success('Identidade visual atualizada com sucesso!')
            await refreshTenant() // Atualiza o tema globalmente
        } catch (error) {
            console.error('Erro ao salvar:', error)
            toast.error('Erro ao salvar alterações.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Identidade Visual</h1>
                <p className="text-gray-500">Personalize a aparência do seu CRM para combinar com sua marca.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Cores da Marca</CardTitle>
                        <CardDescription>
                            Defina as cores principais que serão usadas em botões e destaques.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cor Primária</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1 cursor-pointer"
                                    value={formData.brand_primary_color}
                                    onChange={(e) => setFormData({ ...formData, brand_primary_color: e.target.value })}
                                />
                                <Input
                                    value={formData.brand_primary_color}
                                    onChange={(e) => setFormData({ ...formData, brand_primary_color: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Cor Secundária</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1 cursor-pointer"
                                    value={formData.brand_secondary_color}
                                    onChange={(e) => setFormData({ ...formData, brand_secondary_color: e.target.value })}
                                />
                                <Input
                                    value={formData.brand_secondary_color}
                                    onChange={(e) => setFormData({ ...formData, brand_secondary_color: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados da Empresa</CardTitle>
                        <CardDescription>
                            Informações visíveis para seus clientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome Comercial</Label>
                            <Input
                                value={formData.business_name}
                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                placeholder="Ex: Barbearia do Beto"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>URL do Logo</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.logo_url}
                                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                    placeholder="https://..."
                                />
                                <Button variant="outline" size="icon">
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Recomendado: PNG transparente, max 200px largura.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
