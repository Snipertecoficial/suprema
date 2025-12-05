'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Plus, Trash2, CreditCard, Receipt, DollarSign } from 'lucide-react'
import {
  PaymentMethod,
  PaymentTransaction,
  PaymentItem,
  CreatePaymentTransactionInput,
  CreatePaymentItemInput,
  PaymentMethodSummary,
  formatCurrency,
} from '@/types/payments'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  appointmentData: {
    service_name: string
    client_name: string
    client_id: string | null
    professional_id: string | null
    price: number
  }
  unitId: string
  userId: string
  onPaymentComplete?: () => void
}

interface PaymentFormItem {
  payment_method_id: string
  amount: number
  installments: number
  authorization_code: string
}

export function PaymentModal({
  isOpen,
  onClose,
  appointmentId,
  appointmentData,
  unitId,
  userId,
  onPaymentComplete,
}: PaymentModalProps) {
  const supabase = createClient()

  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)

  // Valores do serviço
  const [totalAmount, setTotalAmount] = useState(appointmentData.price)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [finalAmount, setFinalAmount] = useState(appointmentData.price)

  // Itens de pagamento
  const [paymentItems, setPaymentItems] = useState<PaymentFormItem[]>([
    {
      payment_method_id: '',
      amount: 0,
      installments: 1,
      authorization_code: '',
    },
  ])

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods()
    }
  }, [isOpen])

  useEffect(() => {
    setFinalAmount(totalAmount - discountAmount)
  }, [totalAmount, discountAmount])

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .order('display_order')

    if (!error && data) {
      setMethods(data)
    }
  }

  const addPaymentItem = () => {
    setPaymentItems([
      ...paymentItems,
      {
        payment_method_id: '',
        amount: 0,
        installments: 1,
        authorization_code: '',
      },
    ])
  }

  const removePaymentItem = (index: number) => {
    setPaymentItems(paymentItems.filter((_, i) => i !== index))
  }

  const updatePaymentItem = (index: number, field: keyof PaymentFormItem, value: any) => {
    const updated = [...paymentItems]
    updated[index] = { ...updated[index], [field]: value }
    setPaymentItems(updated)
  }

  const calculateTotals = () => {
    const totalPaid = paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    const remaining = finalAmount - totalPaid

    // Calcular split previsto
    let totalSalon = 0
    let totalProfessional = 0
    let totalFees = 0

    paymentItems.forEach((item) => {
      if (item.payment_method_id) {
        const method = methods.find((m) => m.id === item.payment_method_id)
        if (method && item.amount > 0) {
          const feeAmount = item.amount * (method.fee_percentage / 100)
          const netAmount = item.amount - feeAmount
          const salonAmount = netAmount * (method.salon_percentage / 100)
          const professionalAmount = netAmount * (method.professional_percentage / 100)

          totalFees += feeAmount
          totalSalon += salonAmount
          totalProfessional += professionalAmount
        }
      }
    })

    return {
      totalPaid,
      remaining,
      totalFees,
      totalSalon,
      totalProfessional,
    }
  }

  const totals = calculateTotals()

  const handleSubmit = async () => {
    // Validações
    if (paymentItems.length === 0 || !paymentItems[0].payment_method_id) {
      toast.error('Adicione pelo menos uma forma de pagamento')
      return
    }

    if (totals.remaining !== 0) {
      toast.error(`Faltam ${formatCurrency(Math.abs(totals.remaining))} para completar o pagamento`)
      return
    }

    setLoading(true)

    try {
      // 1. Criar transação
      const transactionData: CreatePaymentTransactionInput = {
        unit_id: unitId,
        appointment_id: appointmentId,
        client_id: appointmentData.client_id,
        professional_id: appointmentData.professional_id,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        created_by: userId,
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert(transactionData)
        .select()
        .single()

      if (transactionError) {
        throw transactionError
      }

      // 2. Criar itens de pagamento
      const itemsData: CreatePaymentItemInput[] = paymentItems
        .filter((item) => item.payment_method_id && item.amount > 0)
        .map((item) => ({
          transaction_id: transaction.id,
          payment_method_id: item.payment_method_id,
          amount: item.amount,
          installments: item.installments || 1,
          authorization_code: item.authorization_code || null,
          status: 'confirmed',
          created_by: userId,
        }))

      const { error: itemsError } = await supabase.from('payment_items').insert(itemsData)

      if (itemsError) {
        throw itemsError
      }

      // 3. Atualizar appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          payment_transaction_id: transaction.id,
          payment_status: 'paid',
          status: 'completed',
        })
        .eq('id', appointmentId)

      if (appointmentError) {
        throw appointmentError
      }

      toast.success('Pagamento processado com sucesso!')
      onPaymentComplete?.()
      onClose()
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      toast.error('Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const getMethodById = (id: string) => {
    return methods.find((m) => m.id === id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Processar Pagamento
          </DialogTitle>
          <DialogDescription>
            {appointmentData.service_name} - {appointmentData.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Valores do Serviço */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_amount">Valor Total</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="discount_amount">Desconto</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={totalAmount}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-purple-900">Valor Final:</span>
                  <span className="text-2xl font-bold text-purple-600">{formatCurrency(finalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formas de Pagamento */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Formas de Pagamento</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPaymentItem} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {paymentItems.map((item, index) => {
                const selectedMethod = getMethodById(item.payment_method_id)
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <Label>Forma de Pagamento</Label>
                          <select
                            value={item.payment_method_id}
                            onChange={(e) => updatePaymentItem(index, 'payment_method_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Selecione...</option>
                            {methods.map((method) => (
                              <option key={method.id} value={method.id}>
                                {method.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-3">
                          <Label>Valor</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.amount || ''}
                            onChange={(e) => updatePaymentItem(index, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                          />
                        </div>

                        {selectedMethod?.allows_installments && (
                          <div className="col-span-2">
                            <Label>Parcelas</Label>
                            <Input
                              type="number"
                              min="1"
                              max={selectedMethod.max_installments}
                              value={item.installments}
                              onChange={(e) => updatePaymentItem(index, 'installments', parseInt(e.target.value) || 1)}
                            />
                          </div>
                        )}

                        <div className={selectedMethod?.allows_installments ? 'col-span-1' : 'col-span-3'}>
                          <Label>&nbsp;</Label>
                          {paymentItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePaymentItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {selectedMethod?.requires_machine && (
                        <div className="mt-3">
                          <Label>Código de Autorização (opcional)</Label>
                          <Input
                            value={item.authorization_code}
                            onChange={(e) => updatePaymentItem(index, 'authorization_code', e.target.value)}
                            placeholder="Ex: 123456"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Resumo */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Total Pago:</span>
                <span className="font-semibold">{formatCurrency(totals.totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Restante:</span>
                <span className={`font-semibold ${totals.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(totals.remaining)}
                </span>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Taxas:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(totals.totalFees)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Salão:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(totals.totalSalon)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Profissional:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(totals.totalProfessional)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || totals.remaining !== 0}
              className="gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
