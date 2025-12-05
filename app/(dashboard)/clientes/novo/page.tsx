'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, User } from 'lucide-react'
import { toast } from 'sonner'
import type { CreateClientInput, Gender } from '@/types/clients'

export default function NovoClientePage() {
  const { profile, user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<CreateClientInput>>({
    full_name: '',
    phone: '',
    email: '',
    birth_date: '',
    gender: undefined,
    cpf: '',
    notes: '',
    internal_notes: '',
    allergies: '',
    health_restrictions: '',
    marketing_consent: true,
    whatsapp_consent: true,
    sms_consent: false,
    email_consent: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile?.unit_id) {
      toast.error('Erro: Unidade não identificada')
      return
    }

    if (!formData.full_name?.trim()) {
      toast.error('Nome do cliente é obrigatório')
      return
    }

    setSaving(true)

    try {
      const clientData: CreateClientInput = {
        unit_id: profile.unit_id,
        full_name: formData.full_name,
        phone: formData.phone || null,
        email: formData.email || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        cpf: formData.cpf || null,
        notes: formData.notes || null,
        internal_notes: formData.internal_notes || null,
        allergies: formData.allergies || null,
        health_restrictions: formData.health_restrictions || null,
        marketing_consent: formData.marketing_consent || false,
        whatsapp_consent: formData.whatsapp_consent || false,
        sms_consent: formData.sms_consent || false,
        email_consent: formData.email_consent || false,
        created_by: user?.id || null,
      }

      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (error) throw error

      toast.success('Cliente cadastrado com sucesso!')
      router.push(`/clientes/${data.id}`)

    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error)
      toast.error('Erro ao cadastrar cliente: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof CreateClientInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-gray-500">Cadastre um novo cliente no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
            <TabsTrigger value="saude">Saúde e Alergias</TabsTrigger>
            <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          </TabsList>

          {/* Aba: Dados Básicos */}
          <TabsContent value="dados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => updateField('full_name', e.target.value)}
                      required
                      placeholder="Ex: Maria Silva Santos"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone/WhatsApp</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="maria@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date || ''}
                      onChange={(e) => updateField('birth_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gênero</Label>
                    <Select
                      value={formData.gender || undefined}
                      onValueChange={(value) => updateField('gender', value as Gender)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                        <SelectItem value="not_informed">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf || ''}
                      onChange={(e) => updateField('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações Gerais</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Preferências, comentários gerais..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Visível para o cliente (ex: preferências de horário, produtos favoritos)
                  </p>
                </div>

                <div>
                  <Label htmlFor="internal_notes">Observações Internas</Label>
                  <Textarea
                    id="internal_notes"
                    value={formData.internal_notes || ''}
                    onChange={(e) => updateField('internal_notes', e.target.value)}
                    placeholder="Informações apenas para a equipe..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Apenas para equipe interna (ex: alertas, cuidados especiais)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Saúde e Alergias */}
          <TabsContent value="saude" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Saúde</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies || ''}
                    onChange={(e) => updateField('allergies', e.target.value)}
                    placeholder="Liste todas as alergias conhecidas..."
                    rows={4}
                  />
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ Importante: Informações críticas de segurança
                  </p>
                </div>

                <div>
                  <Label htmlFor="health_restrictions">Restrições de Saúde</Label>
                  <Textarea
                    id="health_restrictions"
                    value={formData.health_restrictions || ''}
                    onChange={(e) => updateField('health_restrictions', e.target.value)}
                    placeholder="Gestação, problemas dermatológicos, medicamentos em uso..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: Gestante, problemas de pele, uso de medicamentos, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Preferências */}
          <TabsContent value="preferencias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Consentimentos e Preferências</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whatsapp_consent"
                      checked={formData.whatsapp_consent}
                      onCheckedChange={(checked) => updateField('whatsapp_consent', checked)}
                    />
                    <Label htmlFor="whatsapp_consent" className="font-normal cursor-pointer">
                      Aceita receber mensagens via WhatsApp
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sms_consent"
                      checked={formData.sms_consent}
                      onCheckedChange={(checked) => updateField('sms_consent', checked)}
                    />
                    <Label htmlFor="sms_consent" className="font-normal cursor-pointer">
                      Aceita receber SMS
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email_consent"
                      checked={formData.email_consent}
                      onCheckedChange={(checked) => updateField('email_consent', checked)}
                    />
                    <Label htmlFor="email_consent" className="font-normal cursor-pointer">
                      Aceita receber emails
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketing_consent"
                      checked={formData.marketing_consent}
                      onCheckedChange={(checked) => updateField('marketing_consent', checked)}
                    />
                    <Label htmlFor="marketing_consent" className="font-normal cursor-pointer">
                      Aceita receber promoções e novidades
                    </Label>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r mt-6">
                  <p className="text-sm text-blue-700">
                    <strong>LGPD:</strong> Todos os consentimentos são armazenados de forma segura
                    e podem ser revogados a qualquer momento pelo cliente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-[#00a884] hover:bg-[#008f6f]"
            disabled={saving}
          >
            {saving ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Cadastrar Cliente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
