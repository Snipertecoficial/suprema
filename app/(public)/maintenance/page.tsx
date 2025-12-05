'use client'

/**
 * =====================================================
 * PÁGINA DE MANUTENÇÃO
 * =====================================================
 * Exibida quando system_settings.maintenance_mode = true
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MaintenancePage() {
  const [message, setMessage] = useState('Sistema em manutenção. Voltamos em breve.')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaintenanceMessage()

    // Verificar a cada 30 segundos se saiu do modo manutenção
    const interval = setInterval(() => {
      checkMaintenanceMode()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadMaintenanceMessage = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('system_settings')
      .select('maintenance_message')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (data?.maintenance_message) {
      setMessage(data.maintenance_message)
    }

    setLoading(false)
  }

  const checkMaintenanceMode = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('system_settings')
      .select('maintenance_mode')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    // Se saiu do modo manutenção, recarregar a página
    if (data && !data.maintenance_mode) {
      window.location.href = '/dashboard'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone */}
        <div className="mb-8">
          <div className="text-8xl mb-4 animate-pulse">🔧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Em Manutenção
          </h1>
          <p className="text-gray-600 text-lg">
            {message}
          </p>
        </div>

        {/* Informações */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">O que está acontecendo?</h2>
          <p className="text-sm text-gray-600">
            Estamos realizando melhorias no sistema para oferecer uma experiência ainda melhor.
            Em breve tudo estará funcionando normalmente.
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span>Verificando status a cada 30 segundos...</span>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-500">
          <p>Dúvidas urgentes? Entre em contato:</p>
          <p className="font-semibold mt-1">suporte@aion3.com.br</p>
        </div>
      </div>
    </div>
  )
}
