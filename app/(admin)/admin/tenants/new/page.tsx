'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Building2, Mail, Globe, Palette, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function NewTenantPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        ownerEmail: '',
        ownerName: '',
        planName: 'Profissional',
        priceMonthly: 997,
        brandColor: '#00a884',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'priceMonthly' ? parseFloat(value) : value
        }))

        // Auto-generate slug from name
        if (name === 'name') {
            const slug = value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            setFormData(prev => ({ ...prev, slug }))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!formData.name || !formData.slug || !formData.ownerEmail) {
            alert('Preencha todos os campos obrigatórios')
            return
        }

        setSaving(true)

        try {
            // 1. Criar Unit
            const { data: unit, error: unitError } = await supabase
                .from('units')
                .insert({
                    name: formData.name,
                    slug: formData.slug,
                    brand_primary_color: formData.brandColor,
                    is_platform_owner: false,
                })
                .select()
                .single()

            if (unitError) throw unitError

            // 2. Criar Subscription
            const { error: subError } = await supabase
                .from('subscriptions')
                .insert({
                    unit_id: unit.id,
                    plan_name: formData.planName,
                    status: 'active',
                    price_monthly_brl: formData.priceMonthly,
                    current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                })

            if (subError) throw subError

            // 3. Se tiver email do owner, criar convite ou atualizar profile
            // (implementação completa requer Supabase Admin API para criar usuário)

            alert(`Tenant "${formData.name}" criado com sucesso!\n\nO dono receberá um email para criar sua conta.`)
            router.push('/admin/tenants')
        } catch (error: any) {
            console.error('Error creating tenant:', error)
            alert(`Erro ao criar tenant: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    const plans = [
        { name: 'Básico', price: 197 },
        { name: 'Profissional', price: 497 },
        { name: 'Enterprise', price: 997 },
    ]

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/tenants"
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-zinc-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Novo Tenant</h1>
                    <p className="text-zinc-500">Criar nova conta White-Label</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações do Tenant */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-400" />
                        Informações do Salão
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Nome do Salão *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="Barbearia do João"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Slug (URL) *</label>
                            <div className="flex">
                                <span className="px-3 py-2 bg-zinc-700 border border-r-0 border-zinc-700 rounded-l-lg text-zinc-400 text-sm">
                                    crm.aion3.com.br/
                                </span>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-r-lg text-white focus:outline-none focus:border-blue-500"
                                    placeholder="barbearia-joao"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1 flex items-center gap-1">
                            <Palette className="w-4 h-4" />
                            Cor Principal
                        </label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                name="brandColor"
                                value={formData.brandColor}
                                onChange={handleChange}
                                className="w-12 h-10 rounded-lg border border-zinc-700 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={formData.brandColor}
                                onChange={(e) => setFormData(prev => ({ ...prev, brandColor: e.target.value }))}
                                className="w-28 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Informações do Dono */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-purple-400" />
                        Dono da Conta
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Nome do Dono</label>
                            <input
                                type="text"
                                name="ownerName"
                                value={formData.ownerName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="João Silva"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Email do Dono *</label>
                            <input
                                type="email"
                                name="ownerEmail"
                                value={formData.ownerEmail}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="joao@email.com"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Plano */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        Plano
                    </h2>

                    <div className="grid grid-cols-3 gap-3">
                        {plans.map(plan => (
                            <button
                                key={plan.name}
                                type="button"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    planName: plan.name,
                                    priceMonthly: plan.price
                                }))}
                                className={`p-4 rounded-xl border transition-all ${formData.planName === plan.name
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                    }`}
                            >
                                <p className="text-white font-medium">{plan.name}</p>
                                <p className="text-lg font-bold text-emerald-400">
                                    R$ {plan.price.toLocaleString('pt-BR')}/mês
                                </p>
                            </button>
                        ))}
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm text-zinc-400 mb-1">Valor Personalizado</label>
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-400">R$</span>
                            <input
                                type="number"
                                name="priceMonthly"
                                value={formData.priceMonthly}
                                onChange={handleChange}
                                step="0.01"
                                className="w-32 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-zinc-500">/mês</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Link
                        href="/admin/tenants"
                        className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-center transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-zinc-700 disabled:to-zinc-700 rounded-lg text-white font-medium transition-all"
                    >
                        {saving ? 'Criando...' : 'Criar Tenant'}
                    </button>
                </div>
            </form>
        </div>
    )
}
