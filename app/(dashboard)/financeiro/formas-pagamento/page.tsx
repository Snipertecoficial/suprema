'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, CreditCard, DollarSign, Percent, Settings } from 'lucide-react'
import { PaymentMethod, PaymentMethodType, CreatePaymentMethodInput, UpdatePaymentMethodInput } from '@/types/payments'
import { toast } from 'sonner'

export default function PaymentMethodsPage() {
  const supabase = createClient()
  const { user, profile } = useAuth()

  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    name: '',
    type: 'cash',
    fee_percentage: 0,
    salon_percentage: 50,
    professional_percentage: 50,
    is_active: true,
    requires_machine: false,
    allows_installments: false,
    max_installments: 1,
    display_order: 0,
  })

  useEffect(() => {
    if (profile) {
      fetchPaymentMethods()
    }
  }, [profile])

  const fetchPaymentMethods = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('unit_id', profile?.unit_id)
      .order('display_order')

    if (error) {
      toast.error('Erro ao carregar formas de pagamento')
      console.error(error)
    } else {
      setMethods(data || [])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cash',
      fee_percentage: 0,
      salon_percentage: 50,
      professional_percentage: 50,
      is_active: true,
      requires_machine: false,
      allows_installments: false,
      max_installments: 1,
      display_order: 0,
    })
    setEditingId(null)
    setShowNewForm(false)
  }

  const handleEdit = (method: PaymentMethod) => {
    setFormData(method)
    setEditingId(method.id)
    setShowNewForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || formData.name.trim() === '') {
      toast.error('Nome é obrigatório')
      return
    }

    // Validar que os percentuais somam 100
    const totalPercentage = (formData.salon_percentage || 0) + (formData.professional_percentage || 0)
    if (totalPercentage !== 100) {
      toast.error('A soma dos percentuais do salão e profissional deve ser 100%')
      return
    }

    if (editingId) {
      // Atualizar
      const updateData: UpdatePaymentMethodInput = {
        name: formData.name,
        type: formData.type,
        fee_percentage: formData.fee_percentage,
        salon_percentage: formData.salon_percentage,
        professional_percentage: formData.professional_percentage,
        is_active: formData.is_active,
        requires_machine: formData.requires_machine,
        allows_installments: formData.allows_installments,
        max_installments: formData.max_installments,
        display_order: formData.display_order,
      }

      const { error } = await supabase
        .from('payment_methods')
        .update(updateData)
        .eq('id', editingId)

      if (error) {
        toast.error('Erro ao atualizar forma de pagamento')
        console.error(error)
      } else {
        toast.success('Forma de pagamento atualizada com sucesso')
        fetchPaymentMethods()
        resetForm()
      }
    } else {
      // Criar novo
      const createData: CreatePaymentMethodInput = {
        unit_id: profile?.unit_id!,
        name: formData.name!,
        type: formData.type!,
        fee_percentage: formData.fee_percentage,
        salon_percentage: formData.salon_percentage,
        professional_percentage: formData.professional_percentage,
        is_active: formData.is_active,
        requires_machine: formData.requires_machine,
        allows_installments: formData.allows_installments,
        max_installments: formData.max_installments,
        display_order: formData.display_order,
        created_by: user?.id || null,
      }

      const { error } = await supabase
        .from('payment_methods')
        .insert(createData)

      if (error) {
        toast.error('Erro ao criar forma de pagamento')
        console.error(error)
      } else {
        toast.success('Forma de pagamento criada com sucesso')
        fetchPaymentMethods()
        resetForm()
      }
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?\n\nEsta ação não pode ser desfeita.`)) {
      return
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao excluir forma de pagamento')
      console.error(error)
    } else {
      toast.success('Forma de pagamento excluída com sucesso')
      fetchPaymentMethods()
    }
  }

  const getTypeLabel = (type: PaymentMethodType) => {
    const labels: Record<PaymentMethodType, string> = {
      cash: 'Dinheiro',
      pix: 'Pix',
      debit_card: 'Débito',
      credit_card: 'Crédito',
      transfer: 'Transferência',
      other: 'Outro',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formas de Pagamento</h1>
          <p className="text-gray-500 mt-1">Configure as formas de pagamento e taxas</p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Forma de Pagamento
        </Button>
      </div>

      {/* Form de Criação/Edição */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar' : 'Nova'} Forma de Pagamento</CardTitle>
            <CardDescription>
              Configure os detalhes, taxas e split desta forma de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Cartão de Crédito"
                    required
                  />
                </div>

                {/* Tipo */}
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethodType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="cash">Dinheiro</option>
                    <option value="pix">Pix</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="transfer">Transferência</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                {/* Taxa */}
                <div>
                  <Label htmlFor="fee_percentage">Taxa (%)</Label>
                  <Input
                    id="fee_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.fee_percentage}
                    onChange={(e) => setFormData({ ...formData, fee_percentage: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 3.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Taxa cobrada pela operadora (ex: 3.5% para crédito)</p>
                </div>

                {/* Ordem */}
                <div>
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Split */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Split (Divisão de Valores)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="salon_percentage">Salão (%)</Label>
                    <Input
                      id="salon_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.salon_percentage}
                      onChange={(e) => {
                        const salon = parseFloat(e.target.value) || 0
                        setFormData({
                          ...formData,
                          salon_percentage: salon,
                          professional_percentage: 100 - salon,
                        })
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="professional_percentage">Profissional (%)</Label>
                    <Input
                      id="professional_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.professional_percentage}
                      onChange={(e) => {
                        const professional = parseFloat(e.target.value) || 0
                        setFormData({
                          ...formData,
                          professional_percentage: professional,
                          salon_percentage: 100 - professional,
                        })
                      }}
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  A soma deve ser 100%. O split é aplicado sobre o valor líquido (após taxa).
                </p>
              </div>

              {/* Configurações */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ativo</Label>
                    <p className="text-xs text-gray-500">Disponível para uso</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requer Maquininha</Label>
                    <p className="text-xs text-gray-500">Necessita de equipamento</p>
                  </div>
                  <Switch
                    checked={formData.requires_machine}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_machine: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permite Parcelamento</Label>
                    <p className="text-xs text-gray-500">Pode dividir em parcelas</p>
                  </div>
                  <Switch
                    checked={formData.allows_installments}
                    onCheckedChange={(checked) => setFormData({ ...formData, allows_installments: checked })}
                  />
                </div>

                {formData.allows_installments && (
                  <div>
                    <Label htmlFor="max_installments">Máximo de Parcelas</Label>
                    <Input
                      id="max_installments"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.max_installments}
                      onChange={(e) => setFormData({ ...formData, max_installments: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Criar'} Forma de Pagamento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Formas de Pagamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => (
          <Card key={method.id} className={!method.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{method.name}</CardTitle>
                    <p className="text-sm text-gray-500">{getTypeLabel(method.type)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(method)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(method.id, method.name)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxa:</span>
                <span className="font-semibold">{method.fee_percentage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Salão:</span>
                <span className="font-semibold text-green-600">{method.salon_percentage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profissional:</span>
                <span className="font-semibold text-blue-600">{method.professional_percentage}%</span>
              </div>
              {method.allows_installments && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Parcelas:</span>
                  <span className="font-semibold">Até {method.max_installments}x</span>
                </div>
              )}
              <div className="flex gap-2 pt-2 flex-wrap">
                {!method.is_active && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Inativo</span>
                )}
                {method.requires_machine && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded">Maquininha</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {methods.length === 0 && !showNewForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Nenhuma forma de pagamento cadastrada</p>
            <Button onClick={() => setShowNewForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeira Forma de Pagamento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
