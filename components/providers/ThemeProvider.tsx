'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthProvider'

export interface ThemeSettings {
  logo_url: string | null
  brand_name: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  sidebar_bg_color: string
  custom_css: string | null
}

const defaultTheme: ThemeSettings = {
  logo_url: null,
  brand_name: 'Beto Style',
  primary_color: '#8B5CF6',
  secondary_color: '#6B7280',
  accent_color: '#EC4899',
  sidebar_bg_color: '#FFFFFF',
  custom_css: null
}

const ThemeContext = createContext<ThemeSettings>(defaultTheme)

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.unit_id) return

    const fetchTheme = async () => {
      const { data, error } = await supabase
        .from('units')
        .select('logo_url, brand_name, primary_color, secondary_color, accent_color, sidebar_bg_color, custom_css')
        .eq('id', profile.unit_id)
        .single()

      if (error) {
        // Se der erro, usar tema padrão silenciosamente
        // Provavelmente os campos ainda não existem no banco
        console.warn('Usando tema padrão (campos de personalização podem não existir no banco)')
        return
      }

      if (data) {
        setTheme({
          logo_url: data.logo_url || null,
          brand_name: data.brand_name || 'Beto Style',
          primary_color: data.primary_color || '#8B5CF6',
          secondary_color: data.secondary_color || '#6B7280',
          accent_color: data.accent_color || '#EC4899',
          sidebar_bg_color: data.sidebar_bg_color || '#FFFFFF',
          custom_css: data.custom_css || null
        })
      }
    }

    fetchTheme()

    // Realtime para atualizar quando as configurações mudarem
    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'units',
          filter: `id=eq.${profile.unit_id}`
        },
        (payload) => {
          const updated = payload.new as any
          setTheme({
            logo_url: updated.logo_url,
            brand_name: updated.brand_name || 'Beto Style',
            primary_color: updated.primary_color || '#8B5CF6',
            secondary_color: updated.secondary_color || '#6B7280',
            accent_color: updated.accent_color || '#EC4899',
            sidebar_bg_color: updated.sidebar_bg_color || '#FFFFFF',
            custom_css: updated.custom_css
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.unit_id])

  // Aplicar CSS customizado
  useEffect(() => {
    if (theme.custom_css) {
      const styleId = 'custom-css'
      let styleElement = document.getElementById(styleId) as HTMLStyleElement

      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = styleId
        document.head.appendChild(styleElement)
      }

      styleElement.textContent = theme.custom_css
    }
  }, [theme.custom_css])

  // Aplicar variáveis CSS
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', theme.primary_color)
    document.documentElement.style.setProperty('--secondary-color', theme.secondary_color)
    document.documentElement.style.setProperty('--accent-color', theme.accent_color)
    document.documentElement.style.setProperty('--sidebar-bg-color', theme.sidebar_bg_color)
  }, [theme])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}
