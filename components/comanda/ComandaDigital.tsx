'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Receipt, ShoppingCart, X, CheckCircle } from 'lucide-react'
import {
  ComandaItem,
  ComandaItemType,
  CreateComandaItemInput,
  calculateComandaTotals,
  calculateItemTotal,
  formatQuantity,
  getItemTypeLabel,
  getItemStatusColor,
  getItemStatusLabel,
} from '@/types/comanda'
import { formatCurrency } from '@/types/payments'
import { toast } from 'sonner'

interface ComandaDigitalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  appointmentData: {
    service_name: string
    client_name: string
    price: number
  }
  unitId: string
  professionalId: string
  userId: string
  onComandaUpdate?: () => void
}

interface ItemForm {
  item_name: string
  item_type: ComandaItemType
  quantity: number
  unit_price: number
  discount_amount: number
  item_description: string
}

export function ComandaDigital({
  isOpen,
  onClose,
  appointmentId,
  appointmentData,
  unitId,
  professionalId,
  userId,
  onComandaUpdate,
}: ComandaDigitalProps) {
  const supabase = createClient()

  const [items, setItems] = useState<ComandaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState<ItemForm>({
    item_name: '',
    item_type: 'product',
    quantity: 1,
    unit_price: 0,
    discount_amount: 0,
    item_description: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchComandaItems()
    }
  }, [isOpen])

  const fetchComandaItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('comanda_items')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      item_name: '',
      item_type: 'product',
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      item_description: '',
    })
    setShowAddForm(false)
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.item_name || formData.unit_price <= 0) {
      toast.error('Preencha o nome e o preço do item')
      return
    }

    const { total_price, final_price } = calculateItemTotal(
      formData.quantity,
      formData.unit_price,
      formData.discount_amount
    )

    const itemData: CreateComandaItemInput = {
      appointment_id: appointmentId,
      unit_id: unitId,
      item_type: formData.item_type,
      item_name: formData.item_name,
      item_description: formData.item_description || null,
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      discount_amount: formData.discount_amount,
      professional_id: professionalId,
      affects_stock: formData.item_type === 'product',
      created_by: userId,
    }

    const { error } = await supabase.from('comanda_items').insert(itemData)

    if (error) {
      toast.error('Erro ao adicionar item')
      console.error(error)
    } else {
      toast.success('Item adicionado à comanda')
      fetchComandaItems()
      resetForm()
      onComandaUpdate?.()
    }
  }

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Tem certeza que deseja remover "${itemName}"?`)) {
      return
    }

    const { error } = await supabase
      .from('comanda_items')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancelled_reason: 'Removido pelo usuário',
      })
      .eq('id', itemId)

    if (error) {
      toast.error('Erro ao remover item')
      console.error(error)
    } else {
      toast.success('Item removido da comanda')
      fetchComandaItems()
      onComandaUpdate?.()
    }
  }

  const handleCloseComanda = async () => {
    if (!confirm('Fechar a comanda? Todos os itens pendentes serão confirmados.')) {
      return
    }

    const { error } = await supabase.rpc('close_comanda', {
      p_appointment_id: appointmentId,
    })

    if (error) {
      toast.error('Erro ao fechar comanda')
      console.error(error)
    } else {
      toast.success('Comanda fechada com sucesso')
      onComandaUpdate?.()
      onClose()
    }
  }

  const totals = calculateComandaTotals(appointmentData.price, items)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Comanda Digital
          </DialogTitle>
          <DialogDescription>
            {appointmentData.service_name} - {appointmentData.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Serviço Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Serviço Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{appointmentData.service_name}</p>
                  <p className="text-sm text-gray-500">1x</p>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(appointmentData.price)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Itens Adicionais */}
          {items.filter((item) => item.status !== 'cancelled').length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Itens Adicionais
              </h3>
              <div className="space-y-2">
                {items
                  .filter((item) => item.status !== 'cancelled')
                  .map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{item.item_name}</p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${getItemStatusColor(item.status)}`}
                              >
                                {getItemStatusLabel(item.status)}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {getItemTypeLabel(item.item_type)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {formatQuantity(item.quantity)}x {formatCurrency(item.unit_price)}
                              {item.discount_amount > 0 && (
                                <span className="text-red-600 ml-2">
                                  (desconto: {formatCurrency(item.discount_amount)})
                                </span>
                              )}
                            </p>
                            {item.item_description && (
                              <p className="text-xs text-gray-400 mt-1">{item.item_description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold">{formatCurrency(item.final_price)}</p>
                            {item.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id, item.item_name)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Formulário de Adicionar Item */}
          {showAddForm ? (
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Adicionar Item</CardTitle>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="item_name">Nome do Item *</Label>
                      <Input
                        id="item_name"
                        value={formData.item_name}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        placeholder="Ex: Ampola Reparadora"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="item_type">Tipo *</Label>
                      <select
                        id="item_type"
                        value={formData.item_type}
                        onChange={(e) =>
                          setFormData({ ...formData, item_type: e.target.value as ComandaItemType })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="product">Produto</option>
                        <option value="service">Serviço Extra</option>
                        <option value="extra">Outro</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantidade *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="unit_price">Preço Unitário *</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_price || ''}
                        onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                        placeholder="0,00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount_amount">Desconto</Label>
                      <Input
                        id="discount_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discount_amount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0,00"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="item_description">Observações</Label>
                      <Input
                        id="item_description"
                        value={formData.item_description}
                        onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                        placeholder="Detalhes do item..."
                      />
                    </div>
                  </div>

                  {/* Preview do Total */}
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Total do item:</span>
                      <span className="text-lg font-bold text-purple-600">
                        {formatCurrency(
                          calculateItemTotal(formData.quantity, formData.unit_price, formData.discount_amount)
                            .final_price
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">Adicionar Item</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setShowAddForm(true)} className="w-full gap-2" variant="outline">
              <Plus className="w-4 h-4" />
              Adicionar Item à Comanda
            </Button>
          )}

          {/* Totais */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Serviço:</span>
                <span className="font-semibold">{formatCurrency(totals.service_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Itens Extras:</span>
                <span className="font-semibold">{formatCurrency(totals.items_subtotal)}</span>
              </div>
              {totals.discount_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Descontos:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(totals.discount_total)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total da Comanda:</span>
                  <span className="text-2xl font-bold text-purple-600">{formatCurrency(totals.final_total)}</span>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-600 pt-2">
                <span>Pendentes: {totals.pending_items}</span>
                <span>Confirmados: {totals.confirmed_items}</span>
                {totals.cancelled_items > 0 && <span>Cancelados: {totals.cancelled_items}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Continuar Editando
            </Button>
            <Button onClick={handleCloseComanda} className="gap-2" disabled={totals.pending_items === 0}>
              <CheckCircle className="w-4 h-4" />
              Fechar Comanda
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
