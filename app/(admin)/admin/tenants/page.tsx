'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    Building2,
    ExternalLink,
    CheckCircle,
    XCircle,
    Plus,
    Edit2,
    Trash2,
    Users,
    DollarSign,
    MoreVertical
} from 'lucide-react'
import Image from 'next/image'

interface Unit {
    id: string
    name: string
    slug: string
    logo_url: string | null
    created_at: string
    is_platform_owner: boolean | null
}

interface Subscription {
    unit_id: string
    status: string
    plan_name: string
    price_monthly_brl: number
    current_period_end: string
}

export default function ClientesPage() {
    const [units, setUnits] = useState<Unit[]>([])
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        loadClientes()
    }, [])

    async function loadClientes() {
        try {
            // Carregar units (EXCLUINDO plataforma AION3)
            const { data: unitsData, error: unitsError } = await supabase
                .from('units')
                .select('id, name, slug, logo_url, created_at, is_platform_owner')
                .or('is_platform_owner.eq.false,is_platform_owner.is.null')
                .order('created_at', { ascending: false })

            if (unitsError) throw unitsError

            // Carregar subscriptions
            const { data: subsData } = await supabase
                .from('subscriptions')
                .select('unit_id, status, plan_name, price_monthly_brl, current_period_end')

            setUnits(unitsData || [])
            setSubscriptions(subsData || [])
            setLoading(false)
        } catch (error) {
            console.error('Error loading tenants:', error)
            setLoading(false)
        }
    }

    function getSubscriptionInfo(unitId: string) {
        const sub = subscriptions.find((s) => s.unit_id === unitId)
        if (!sub) return { status: 'inactive', plan: 'Sem plano', active: false, price: 0 }

        const isActive = sub.status === 'active' || sub.status === 'trialing'
        return {
            status: sub.status,
            plan: sub.plan_name,
            active: isActive,
            price: sub.price_monthly_brl || 0,
            expiresAt: sub.current_period_end
        }
    }

    async function handleDeleteCliente(id: string, name: string) {
        if (!confirm(`Tem certeza que deseja deletar o cliente "${name}"?\n\nEsta ação é irreversível e removerá todos os dados associados.`)) {
            return
        }

        setDeletingId(id)
        try {
            // Deletar subscription primeiro
            await supabase.from('subscriptions').delete().eq('unit_id', id)
            // Deletar unit
            const { error } = await supabase.from('units').delete().eq('id', id)

            if (error) throw error

            loadClientes()
        } catch (error) {
            console.error('Error deleting cliente:', error)
            alert('Erro ao deletar cliente. Verifique o console.')
        } finally {
            setDeletingId(null)
        }
    }

    async function handleImpersonate(unitId: string, slug: string, name: string) {
        try {
            const response = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitId, unitSlug: slug })
            })

            const data = await response.json()

            if (data.success) {
                // Redirecionar para o dashboard do tenant
                window.location.href = '/'
            } else {
                alert('Erro ao acessar tenant: ' + data.error)
            }
        } catch (error: any) {
            console.error('Erro no impersonate:', error)
            alert('Erro ao acessar tenant')
        }
    }

    // Calcular MRR total
    const totalMRR = subscriptions.reduce((sum, sub) => {
        if (sub.status === 'active') {
            return sum + (sub.price_monthly_brl || 0)
        }
        return sum
    }, 0)

    const activeCount = subscriptions.filter(s => s.status === 'active').length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-zinc-400">Carregando tenants...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Gestão de Clientes</h1>
                    <p className="text-zinc-500 mt-1">
                        {units.length} {units.length === 1 ? 'cliente' : 'clientes'} no sistema
                    </p>
                </div>
                <Link
                    href="/admin/tenants/new"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium transition-all shadow-lg shadow-blue-500/25"
                >
                    <Plus className="w-4 h-4" />
                    Novo Cliente
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Total de Clientes</p>
                            <p className="text-xl font-bold text-white">{units.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Ativos</p>
                            <p className="text-xl font-bold text-white">{activeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <DollarSign className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">MRR Total</p>
                            <p className="text-xl font-bold text-white">
                                R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabela de Clientes */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-800/50 border-b border-zinc-800">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                                Cliente
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                                Slug
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                                Plano
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                                Valor
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {units.map((unit) => {
                            const subInfo = getSubscriptionInfo(unit.id)
                            const isDeleting = deletingId === unit.id

                            return (
                                <tr key={unit.id} className={`hover:bg-zinc-800/30 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center overflow-hidden">
                                                {unit.logo_url ? (
                                                    <Image
                                                        src={unit.logo_url}
                                                        alt={unit.name}
                                                        width={40}
                                                        height={40}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <Building2 className="w-5 h-5 text-zinc-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{unit.name}</p>
                                                <p className="text-sm text-zinc-500">
                                                    {new Date(unit.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="px-2 py-1 bg-zinc-800 rounded text-zinc-300 text-sm">
                                            {unit.slug}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {subInfo.active ? (
                                                <>
                                                    <span className="flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <span className="text-emerald-400 text-sm font-medium">Ativo</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                    <span className="text-red-400 text-sm font-medium">Inativo</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-zinc-300">{subInfo.plan}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-white font-medium">
                                            {subInfo.price > 0
                                                ? `R$ ${subInfo.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                : '-'
                                            }
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleImpersonate(unit.id, unit.slug, unit.name)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                                                title="Acessar como este tenant"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Acessar
                                            </button>
                                            <Link
                                                href={`/admin/tenants/${unit.id}/edit`}
                                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                                title="Editar tenant"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteCliente(unit.id, unit.name)}
                                                disabled={isDeleting}
                                                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Deletar cliente"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {units.length === 0 && (
                    <div className="p-12 text-center">
                        <Building2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">Nenhum cliente cadastrado ainda</p>
                        <Link
                            href="/admin/tenants/new"
                            className="inline-block mt-4 text-blue-400 hover:text-blue-300"
                        >
                            Adicionar primeiro cliente
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
