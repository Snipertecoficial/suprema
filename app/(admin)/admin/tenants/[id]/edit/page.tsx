'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    ArrowLeft,
    Building2,
    Save,
    Loader2,
    Palette,
    Globe,
    CreditCard
} from 'lucide-react'

interface Unit {
    id: string
    name: string
    slug: string
    brand_name: string | null
    brand_primary_color: string | null
    brand_secondary_color: string | null
    logo_url: string | null
    business_name: string | null
    is_platform_owner: boolean | null
    created_at: string
}

interface Subscription {
    id: string
    unit_id: string
    status: string
    plan_name: string
    price_monthly_brl: number
    current_period_start: string
    current_period_end: string
}

export default function EditTenantPage() {
    const params = useParams()
    const router = useRouter()
    const tenantId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [unit, setUnit] = useState<Unit | null>(null)
    const [subscription, setSubscription] = useState<Subscription | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        brand_name: '',
        brand_primary_color: '#00a884',
        brand_secondary_color: '#005c4b',
        business_name: '',
        // Subscription
        plan_name: 'AION3 Enterprise',
        price_monthly_brl: '997',
        status: 'active'
    })

    useEffect(() => {
        loadTenant()
    }, [tenantId])

    async function loadTenant() {
        try {
            // Carregar unit
            const { data: unitData, error: unitError } = await supabase
                .from('units')
                .select('*')
                .eq('id', tenantId)
                .single()

            if (unitError) throw unitError

            // Carregar subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('unit_id', tenantId)
                .single()

            setUnit(unitData)
            setSubscription(subData)

            // Preencher formulário
            setFormData({
                name: unitData.name || '',
                slug: unitData.slug || '',
                brand_name: unitData.brand_name || '',
                brand_primary_color: unitData.brand_primary_color || '#00a884',
                brand_secondary_color: unitData.brand_secondary_color || '#005c4b',
                business_name: unitData.business_name || '',
                plan_name: subData?.plan_name || 'AION3 Enterprise',
                price_monthly_brl: subData?.price_monthly_brl?.toString() || '997',
                status: subData?.status || 'active'
            })

        } catch (error) {
            console.error('Erro ao carregar tenant:', error)
            alert('Erro ao carregar tenant')
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            // Atualizar unit
            const { error: unitError } = await supabase
                .from('units')
                .update({
                    name: formData.name,
                    slug: formData.slug,
                    brand_name: formData.brand_name,
                    brand_primary_color: formData.brand_primary_color,
                    brand_secondary_color: formData.brand_secondary_color,
                    business_name: formData.business_name
                })
                .eq('id', tenantId)

            if (unitError) throw unitError

            // Atualizar ou criar subscription
            if (subscription) {
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .update({
                        plan_name: formData.plan_name,
                        price_monthly_brl: parseFloat(formData.price_monthly_brl),
                        status: formData.status
                    })
                    .eq('id', subscription.id)

                if (subError) throw subError
            } else {
                // Criar nova subscription
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .insert({
                        unit_id: tenantId,
                        plan_name: formData.plan_name,
                        price_monthly_brl: parseFloat(formData.price_monthly_brl),
                        status: formData.status,
                        current_period_start: new Date().toISOString(),
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    })

                if (subError) throw subError
            }

            alert('Tenant atualizado com sucesso!')
            router.push('/admin/tenants')

        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        )
    }

    if (!unit) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-400">Tenant não encontrado</p>
                <Link href="/admin/tenants" className="text-blue-400 hover:underline mt-4 inline-block">
                    Voltar
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/tenants"
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-zinc-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Editar Tenant</h1>
                    <p className="text-zinc-500">{unit.name}</p>
                </div>
            </div>

            {/* Informações Básicas */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-white font-medium">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    Informações Básicas
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Nome do Tenant *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            placeholder="Ex: Beto Style"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Slug (URL) *</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            placeholder="ex: beto-style"
                        />
                        <p className="text-xs text-zinc-500 mt-1">URL: /{formData.slug}/login</p>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Nome da Marca</label>
                        <input
                            type="text"
                            value={formData.brand_name}
                            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            placeholder="Nome exibido no sistema"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Razão Social</label>
                        <input
                            type="text"
                            value={formData.business_name}
                            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            placeholder="Razão social da empresa"
                        />
                    </div>
                </div>
            </div>

            {/* Personalização Visual */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-white font-medium">
                    <Palette className="w-5 h-5 text-purple-400" />
                    Personalização Visual
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Cor Primária</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={formData.brand_primary_color}
                                onChange={(e) => setFormData({ ...formData, brand_primary_color: e.target.value })}
                                className="w-12 h-12 rounded-lg border border-zinc-700 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={formData.brand_primary_color}
                                onChange={(e) => setFormData({ ...formData, brand_primary_color: e.target.value })}
                                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Cor Secundária</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={formData.brand_secondary_color}
                                onChange={(e) => setFormData({ ...formData, brand_secondary_color: e.target.value })}
                                className="w-12 h-12 rounded-lg border border-zinc-700 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={formData.brand_secondary_color}
                                onChange={(e) => setFormData({ ...formData, brand_secondary_color: e.target.value })}
                                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500 mb-2">Preview:</p>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: formData.brand_primary_color }}
                        >
                            {formData.brand_name?.charAt(0) || formData.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <p className="text-white font-medium">{formData.brand_name || formData.name}</p>
                            <p className="text-xs text-zinc-500">CRM Profissional</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assinatura */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-white font-medium">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Assinatura
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Plano</label>
                        <select
                            value={formData.plan_name}
                            onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="AION3 Enterprise">AION3 Enterprise</option>
                            <option value="AION3 Pro">AION3 Pro</option>
                            <option value="AION3 Starter">AION3 Starter</option>
                            <option value="Trial">Trial (30 dias)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Valor Mensal (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.price_monthly_brl}
                            onChange={(e) => setFormData({ ...formData, price_monthly_brl: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="active">Ativo</option>
                            <option value="trialing">Trial</option>
                            <option value="past_due">Pagamento Pendente</option>
                            <option value="canceled">Cancelado</option>
                            <option value="suspended">Suspenso</option>
                        </select>
                    </div>
                </div>

                {subscription && (
                    <div className="text-xs text-zinc-500">
                        Período atual: {new Date(subscription.current_period_start).toLocaleDateString('pt-BR')} até {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                    </div>
                )}
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end gap-4">
                <Link
                    href="/admin/tenants"
                    className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                    Cancelar
                </Link>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Salvar Alterações
                </button>
            </div>
        </div>
    )
}
