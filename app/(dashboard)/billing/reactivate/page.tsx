'use client'

/**
 * =====================================================
 * PÁGINA DE REATIVAÇÃO DE ASSINATURA
 * =====================================================
 * Exibida quando assinatura está:
 * - past_due (pagamento atrasado)
 * - canceled (cancelada)
 * - suspended (suspensa pelo admin)
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'

export default function ReactivatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useAuth()

  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingReactivation, setProcessingReactivation] = useState(false)

  const status = searchParams.get('status') || 'unknown'

  useEffect(() => {
    if (!profile?.unit_id) return

    loadSubscription()
  }, [profile?.unit_id])

  const loadSubscription = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('saas_subscriptions')
      .select(`
        *,
        plan:saas_plans(*)
      `)
      .eq('unit_id', profile.unit_id)
      .single()

    if (error) {
      console.error('Erro ao carregar assinatura:', error)
    }

    setSubscription(data)
    setLoading(false)
  }

  const handleReactivate = async () => {
    setProcessingReactivation(true)

    // TODO: Integrar com Stripe para reativar assinatura
    // Por enquanto, apenas redirecionar para página de pagamento

    alert('Redirecionando para página de pagamento...')

    // Redirecionar para Stripe Checkout ou Customer Portal
    // window.location.href = stripeCheckoutUrl

    setProcessingReactivation(false)
  }

  const handleContactSupport = () => {
    // Abrir chat de suporte ou email
    window.open('mailto:suporte@aion3.com.br?subject=Reativação de Assinatura', '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Mensagens por status
  const statusMessages = {
    past_due: {
      title: 'Pagamento Pendente',
      description: 'Seu último pagamento não foi processado com sucesso.',
      icon: '⏰',
      color: 'yellow'
    },
    canceled: {
      title: 'Assinatura Cancelada',
      description: 'Sua assinatura foi cancelada. Reative para continuar usando o sistema.',
      icon: '❌',
      color: 'red'
    },
    suspended: {
      title: 'Conta Suspensa',
      description: 'Sua conta foi suspensa. Entre em contato com o suporte.',
      icon: '🚫',
      color: 'red'
    },
    unknown: {
      title: 'Problema com Assinatura',
      description: 'Há um problema com sua assinatura. Entre em contato com o suporte.',
      icon: '⚠️',
      color: 'gray'
    }
  }

  const currentStatus = statusMessages[status as keyof typeof statusMessages] || statusMessages.unknown

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Ícone de Status */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{currentStatus.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStatus.title}
          </h1>
          <p className="text-gray-600">
            {currentStatus.description}
          </p>
        </div>

        {/* Informações da Assinatura */}
        {subscription && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Plano</p>
                <p className="font-semibold text-gray-900">{subscription.plan?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Valor Mensal</p>
                <p className="font-semibold text-gray-900">
                  R$ {subscription.plan?.price_monthly_brl?.toFixed(2)}
                </p>
              </div>
              {subscription.current_period_end && (
                <div className="col-span-2">
                  <p className="text-gray-500">Vencimento</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="space-y-3">
          {/* Botão de Reativação (se não for suspended) */}
          {status !== 'suspended' && (
            <button
              onClick={handleReactivate}
              disabled={processingReactivation}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingReactivation ? 'Processando...' : 'Reativar Assinatura'}
            </button>
          )}

          {/* Botão de Suporte */}
          <button
            onClick={handleContactSupport}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Falar com Suporte
          </button>

          {/* Link para Logout */}
          <button
            onClick={() => router.push('/logout')}
            className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
          >
            Sair da Conta
          </button>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Por que minha conta está bloqueada?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            {status === 'past_due' && (
              <>
                <li>• Seu cartão de crédito pode ter expirado</li>
                <li>• Pode não haver saldo suficiente</li>
                <li>• O banco pode ter bloqueado a transação</li>
              </>
            )}
            {status === 'canceled' && (
              <>
                <li>• A assinatura foi cancelada anteriormente</li>
                <li>• Você pode reativar a qualquer momento</li>
              </>
            )}
            {status === 'suspended' && (
              <>
                <li>• Pode haver violação dos termos de uso</li>
                <li>• Entre em contato com o suporte para mais detalhes</li>
              </>
            )}
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Dúvidas? Entre em contato:</p>
          <p className="font-semibold">suporte@aion3.com.br</p>
        </div>
      </div>
    </div>
  )
}
