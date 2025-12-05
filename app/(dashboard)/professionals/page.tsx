'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, User, Users } from 'lucide-react'
import { toast } from 'sonner'

type Professional = {
    id: string
    full_name: string
    email?: string
}

export default function ProfessionalsPage() {
    const { profile } = useAuth()
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form States
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [creating, setCreating] = useState(false)

    const fetchProfessionals = async () => {
        if (!profile?.unit_id) return

        setLoading(true)
        // Busca perfis com role 'professional' da unidade
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('unit_id', profile.unit_id)
            .eq('role', 'professional')

        if (data) setProfessionals(data as Professional[])
        setLoading(false)
    }

    useEffect(() => {
        fetchProfessionals()
    }, [profile?.unit_id])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const res = await fetch('/api/professionals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newEmail,
                    password: newPassword,
                    fullName: newName,
                    unitId: profile?.unit_id
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setIsDialogOpen(false)
            setNewName('')
            setNewEmail('')
            setNewPassword('')
            toast.success('Profissional criado com sucesso!')
            fetchProfessionals() // Recarrega lista

        } catch (error: any) {
            toast.error('Erro: ' + error.message)
        } finally {
            setCreating(false)
        }
    }

    if (!profile) return null

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
                    <p className="text-gray-500">Gerencie a equipe da sua unidade.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#00a884] hover:bg-[#008f6f]">
                            <Plus className="mr-2 h-4 w-4" /> Novo Profissional
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cadastrar Profissional</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-4">
                            <div>
                                <Label>Nome Completo</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} required />
                            </div>
                            <div>
                                <Label>Email (Login)</Label>
                                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                            </div>
                            <div>
                                <Label>Senha Inicial</Label>
                                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" className="w-full" disabled={creating}>
                                {creating ? <Loader2 className="animate-spin" /> : 'Cadastrar'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p>Carregando...</p>
                ) : professionals.length === 0 ? (
                    <p className="text-gray-500">Nenhum profissional cadastrado.</p>
                ) : (
                    professionals.map(prof => (
                        <Card key={prof.id}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{prof.full_name}</CardTitle>
                                    <p className="text-sm text-gray-500">Profissional</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end">
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
