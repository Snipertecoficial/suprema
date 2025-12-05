'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { getIsPlatformAdmin } from '@/lib/auth/roles'

interface TenantSettings {
    id: string
    name: string
    slug: string
    logo_url: string | null
    brand_primary_color: string
    brand_secondary_color: string
    business_name: string | null
    is_platform_owner: boolean
}

interface ImpersonationState {
    isImpersonating: boolean
    unitId: string | null
    unitSlug: string | null
}

interface TenantContextType {
    tenant: TenantSettings | null
    loading: boolean
    isPlatformAdmin: boolean
    isImpersonating: boolean
    refreshTenant: () => Promise<void>
    stopImpersonation: () => Promise<void>
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    loading: true,
    isPlatformAdmin: false,
    isImpersonating: false,
    refreshTenant: async () => { },
    stopImpersonation: async () => { }
})

export const useTenant = () => useContext(TenantContext)

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const { profile } = useAuth()
    const [tenant, setTenant] = useState<TenantSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [impersonation, setImpersonation] = useState<ImpersonationState>({
        isImpersonating: false,
        unitId: null,
        unitSlug: null
    })

    // Verificar se há impersonation ativa
    const checkImpersonation = async () => {
        try {
            const response = await fetch('/api/admin/impersonate')
            const data = await response.json()
            setImpersonation({
                isImpersonating: data.isImpersonating,
                unitId: data.unitId || null,
                unitSlug: data.unitSlug || null
            })
            return data
        } catch {
            return { isImpersonating: false }
        }
    }

    const stopImpersonation = async () => {
        try {
            await fetch('/api/admin/impersonate', { method: 'DELETE' })
            setImpersonation({ isImpersonating: false, unitId: null, unitSlug: null })
            window.location.href = '/admin'
        } catch (error) {
            console.error('Erro ao parar impersonation:', error)
        }
    }

    const refreshTenant = async () => {
        // Primeiro verificar impersonation
        const impersonationData = await checkImpersonation()

        // Determinar qual unit_id usar
        const targetUnitId = impersonationData.isImpersonating
            ? impersonationData.unitId
            : profile?.unit_id

        if (!targetUnitId) {
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('units')
                .select(`
                    id,
                    name,
                    slug,
                    logo_url,
                    brand_primary_color,
                    brand_secondary_color,
                    business_name,
                    is_platform_owner
                `)
                .eq('id', targetUnitId)
                .single()

            if (error) {
                console.error('Erro ao carregar configurações do tenant:', error)
                // Se erro for de permissão (RLS), não travar a aplicação
                if (error.code === 'PGRST116' || error.message.includes('permission')) {
                    console.warn('Tenant não encontrado ou sem permissão. Usando defaults.')
                }
                setLoading(false)
                return
            }

            if (data) {
                setTenant(data)
                applyTheme(data)
            }
        } catch (error) {
            console.error('Erro ao carregar configurações do tenant:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyTheme = (settings: TenantSettings) => {
        const root = document.documentElement

        if (settings.brand_primary_color) {
            root.style.setProperty('--brand-primary', settings.brand_primary_color)
            root.style.setProperty('--brand-secondary', settings.brand_secondary_color)
        }
    }

    useEffect(() => {
        refreshTenant()
    }, [profile?.unit_id])

    // Calculate isPlatformAdmin
    const isPlatformAdmin = getIsPlatformAdmin(profile, tenant)

    return (
        <TenantContext.Provider value={{
            tenant,
            loading,
            isPlatformAdmin,
            isImpersonating: impersonation.isImpersonating,
            refreshTenant,
            stopImpersonation
        }}>
            {children}
        </TenantContext.Provider>
    )
}
