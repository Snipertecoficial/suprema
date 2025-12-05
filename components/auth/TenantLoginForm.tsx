'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Unit {
    id: string
    name: string
    slug: string
    logo_url: string | null
    brand_name: string | null
    brand_primary_color: string
    is_platform_owner: boolean
}

interface TenantLoginFormProps {
    unit: Unit
}

export function TenantLoginForm({ unit }: TenantLoginFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) throw authError

            // Verificar role para redirecionamento correto
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_super_admin, role, unit_id')
                .eq('id', data.user.id)
                .single()

            // Verificar se usuário pertence a este tenant (exceto super admin)
            if (!profile?.is_super_admin && profile?.unit_id !== unit.id) {
                await supabase.auth.signOut()
                throw new Error('Você não tem acesso a este tenant')
            }

            // Redirecionar baseado no role
            if (profile?.is_super_admin || unit.is_platform_owner) {
                router.push('/admin')
            } else {
                router.push('/')
            }

            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login')
        } finally {
            setLoading(false)
        }
    }

    const primaryColor = unit.brand_primary_color || '#00a884'
    const displayName = unit.brand_name || unit.name

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            <div className="w-full max-w-md space-y-8 bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800">
                <div className="flex flex-col items-center text-center">
                    {/* Logo */}
                    {unit.logo_url ? (
                        <div
                            className="relative w-32 h-32 mb-6 rounded-full overflow-hidden shadow-lg"
                            style={{
                                borderWidth: '4px',
                                borderStyle: 'solid',
                                borderColor: primaryColor
                            }}
                        >
                            <Image
                                src={unit.logo_url}
                                alt={`${displayName} Logo`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div
                            className="w-32 h-32 mb-6 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                                borderWidth: '4px',
                                borderStyle: 'solid',
                                borderColor: primaryColor
                            }}
                        >
                            {displayName.charAt(0)}
                        </div>
                    )}

                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        {displayName}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        {unit.is_platform_owner
                            ? 'Plataforma de Automação'
                            : 'Gestão Inteligente para seu Negócio'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                                style={{
                                    outlineColor: primaryColor,
                                    borderColor: 'rgb(51 65 85)'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = primaryColor
                                    e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgb(51 65 85)'
                                    e.target.style.boxShadow = 'none'
                                }}
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-slate-300">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                                style={{
                                    outlineColor: primaryColor,
                                    borderColor: 'rgb(51 65 85)'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = primaryColor
                                    e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgb(51 65 85)'
                                    e.target.style.boxShadow = 'none'
                                }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded border border-red-900/50">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full text-white font-bold py-6 text-lg transition-all"
                        style={{
                            backgroundColor: primaryColor,
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.opacity = '0.9'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.opacity = '1'
                            }
                        }}
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Entrar no Sistema'}
                    </Button>
                </form>

                <div className="text-center text-xs text-slate-500 mt-4">
                    Desenvolvido por Aion3 & Antigravity
                </div>
            </div>
        </div>
    )
}
