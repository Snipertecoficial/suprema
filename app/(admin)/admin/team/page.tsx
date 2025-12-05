'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Users,
    Plus,
    Mail,
    Shield,
    Trash2,
    CheckCircle,
    XCircle,
    UserPlus,
    Eye
} from 'lucide-react'

interface TeamMember {
    id: string
    name: string
    email: string
    role: string
    can_impersonate: boolean
    is_active: boolean
    created_at: string
}

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newMember, setNewMember] = useState({
        name: '',
        email: '',
        role: 'demo',
        can_impersonate: false
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadTeamMembers()
    }, [])

    async function loadTeamMembers() {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setMembers(data || [])
        } catch (error) {
            console.error('Error loading team:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddMember() {
        if (!newMember.name || !newMember.email) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('team_members')
                .insert({
                    name: newMember.name,
                    email: newMember.email,
                    role: newMember.role,
                    can_impersonate: newMember.can_impersonate,
                    is_active: true
                })

            if (error) throw error

            setShowAddModal(false)
            setNewMember({ name: '', email: '', role: 'demo', can_impersonate: false })
            loadTeamMembers()
        } catch (error) {
            console.error('Error adding member:', error)
            alert('Erro ao adicionar membro. Verifique o console.')
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteMember(id: string) {
        if (!confirm('Tem certeza que deseja remover este membro?')) return

        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', id)

            if (error) throw error
            loadTeamMembers()
        } catch (error) {
            console.error('Error deleting member:', error)
        }
    }

    async function toggleImpersonate(id: string, current: boolean) {
        try {
            const { error } = await supabase
                .from('team_members')
                .update({ can_impersonate: !current })
                .eq('id', id)

            if (error) throw error
            loadTeamMembers()
        } catch (error) {
            console.error('Error updating member:', error)
        }
    }

    const roleLabels: Record<string, { label: string; color: string }> = {
        demo: { label: 'Demo', color: 'bg-blue-500/20 text-blue-400' },
        sales: { label: 'Vendas', color: 'bg-emerald-500/20 text-emerald-400' },
        support: { label: 'Suporte', color: 'bg-purple-500/20 text-purple-400' },
        developer: { label: 'Dev', color: 'bg-amber-500/20 text-amber-400' },
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-zinc-400">Carregando equipe...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Equipe AION3</h1>
                    <p className="text-zinc-500 mt-1">Gerencie membros internos para demonstrações e suporte</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium transition-all shadow-lg shadow-blue-500/25"
                >
                    <UserPlus className="w-4 h-4" />
                    Adicionar Membro
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                        <p className="text-white font-medium">Permissão de Impersonation</p>
                        <p className="text-sm text-zinc-400 mt-1">
                            Membros com esta permissão podem acessar o painel de qualquer cliente para fazer demonstrações ou suporte técnico.
                        </p>
                    </div>
                </div>
            </div>

            {/* Team List */}
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl overflow-hidden">
                <div className="divide-y divide-zinc-800">
                    {members.map((member) => (
                        <div key={member.id} className="p-4 hover:bg-zinc-800/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{member.name}</p>
                                        <p className="text-sm text-zinc-500 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {member.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleLabels[member.role]?.color || 'bg-zinc-700 text-zinc-400'}`}>
                                        {roleLabels[member.role]?.label || member.role}
                                    </span>

                                    <button
                                        onClick={() => toggleImpersonate(member.id, member.can_impersonate)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${member.can_impersonate
                                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                            }`}
                                        title="Permissão de Impersonation"
                                    >
                                        <Eye className="w-3 h-3" />
                                        {member.can_impersonate ? 'Impersonate ON' : 'Impersonate OFF'}
                                    </button>

                                    <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="p-12 text-center">
                            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-400">Nenhum membro da equipe cadastrado</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-4 text-blue-400 hover:text-blue-300"
                            >
                                Adicionar primeiro membro
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Adicionar Membro</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    placeholder="João Silva"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    placeholder="joao@aion3.com.br"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Função</label>
                                <select
                                    value={newMember.role}
                                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="demo">Demo</option>
                                    <option value="sales">Vendas</option>
                                    <option value="support">Suporte</option>
                                    <option value="developer">Desenvolvedor</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newMember.can_impersonate}
                                    onChange={(e) => setNewMember({ ...newMember, can_impersonate: e.target.checked })}
                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm text-zinc-300">Permitir Impersonation</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={saving || !newMember.name || !newMember.email}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg text-white font-medium transition-colors"
                            >
                                {saving ? 'Salvando...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
