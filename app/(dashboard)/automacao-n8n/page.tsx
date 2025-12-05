'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Download, Upload, Zap, AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTenant } from '@/components/providers/TenantProvider'

interface WorkflowInfo {
  id: string
  name: string
  description: string
  fileName: string
  icon: string
  segments: string[]
  installed: boolean
}

const WORKFLOWS: WorkflowInfo[] = [
  {
    id: 'mcp-agendas',
    name: 'MCP | Agendas Google (Todos Profissionais)',
    description:
      'Conecta agendas do Google para responder consultas e encaixes de horários usando IA.',
    fileName: 'mcp-agendas-beto-style.json',
    icon: '📆',
    segments: ['Salões', 'Clínicas', 'Podologias', 'Barbearias'],
    installed: false
  },
  {
    id: 'agente-principal',
    name: 'Agente Principal | Atendimento com IA (Cíntia)',
    description:
      'Agente de atendimento principal com roteiros prontos para vendas, dúvidas e pós-venda.',
    fileName: 'agente-principal-beto-style-cintia.json',
    icon: '🤖',
    segments: ['Salões', 'Clínicas', 'Podologias', 'Barbearias'],
    installed: false
  },
  {
    id: 'confirmacao-automatica',
    name: 'Confirmação Automática de Agendamentos',
    description:
      'Confirma e reconfirma horários com clientes por WhatsApp, reduzindo faltas.',
    fileName: 'confirmacao-automatica-agendamentos.json',
    icon: '✅',
    segments: ['Salões', 'Clínicas', 'Podologias', 'Barbearias'],
    installed: false
  }
]

export default function AutomacaoN8NPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useAuth()
  const { isPlatformAdmin, loading: tenantLoading } = useTenant()

  // Platform admin access control
  useEffect(() => {
    if (!tenantLoading && !isPlatformAdmin) {
      router.push('/')
    }
  }, [isPlatformAdmin, tenantLoading, router])

  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState<string | null>(null)
  const [config, setConfig] = useState({
    n8n_url: '',
    n8n_api_key: '',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    evolution_api_url: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || '',
    evolution_api_key: process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '',
    gemini_api_key: ''
  })
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>(WORKFLOWS)
  const [configSaved, setConfigSaved] = useState(false)

  useEffect(() => {
    loadSavedConfig()
  }, [profile?.unit_id])

  const loadSavedConfig = async () => {
    if (!profile?.unit_id) return

    const { data } = await supabase
      .from('units')
      .select('n8n_url, n8n_api_key, gemini_api_key')
      .eq('id', profile.unit_id)
      .single()

    if (data) {
      setConfig(prev => ({
        ...prev,
        n8n_url: data.n8n_url || '',
        n8n_api_key: data.n8n_api_key || '',
        gemini_api_key: data.gemini_api_key || ''
      }))

      if (data.n8n_url && data.n8n_api_key) {
        setConfigSaved(true)
        checkInstalledWorkflows(data.n8n_url, data.n8n_api_key)
      }
    }
  }

  const checkInstalledWorkflows = async (n8nUrl: string, apiKey: string) => {
    try {
      const response = await fetch(`${n8nUrl}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': apiKey
        }
      })

      if (response.ok) {
        const data = await response.json()
        const installedNames = data.data?.map((w: any) => w.name) || []

        setWorkflows(prev =>
          prev.map(w => ({
            ...w,
            installed: installedNames.includes(w.name)
          }))
        )
      }
    } catch (error) {
      console.error('Erro ao verificar workflows:', error)
    }
  }

  const handleSaveConfig = async () => {
    if (!profile?.unit_id) return

    if (!config.n8n_url || !config.n8n_api_key) {
      toast.error('Preencha URL e API Key do n8n')
      return
    }

    setLoading(true)

    try {
      // Testar conexão com n8n
      const testResponse = await fetch(`${config.n8n_url}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': config.n8n_api_key
        }
      })

      if (!testResponse.ok) {
        throw new Error('Falha ao conectar com n8n. Verifique URL e API Key')
      }

      // Salvar configuração no banco
      const { error } = await supabase
        .from('units')
        .update({
          n8n_url: config.n8n_url,
          n8n_api_key: config.n8n_api_key,
          gemini_api_key: config.gemini_api_key
        })
        .eq('id', profile.unit_id)

      if (error) throw error

      setConfigSaved(true)
      toast.success('Configuração salva com sucesso!')

      // Verificar workflows instalados
      await checkInstalledWorkflows(config.n8n_url, config.n8n_api_key)

    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao salvar configuração')
    } finally {
      setLoading(false)
    }
  }

  const handleInstallWorkflow = async (workflow: WorkflowInfo) => {
    if (!configSaved || !config.n8n_url || !config.n8n_api_key) {
      toast.error('Configure n8n primeiro')
      return
    }

    setInstalling(workflow.id)

    try {
      // 1. Buscar o JSON do workflow (exposto em /public/n8n-workflows)
      const workflowResponse = await fetch(`/n8n-workflows/${workflow.fileName}`)
      const workflowJson = await workflowResponse.json()

      // 2. Substituir placeholders pelas credenciais reais
      let workflowString = JSON.stringify(workflowJson)

      // Substituir variáveis
      workflowString = workflowString.replace(/\{\{SUPABASE_URL\}\}/g, config.supabase_url)
      workflowString = workflowString.replace(/\{\{SUPABASE_KEY\}\}/g, config.supabase_key)
      workflowString = workflowString.replace(/\{\{EVOLUTION_API_URL\}\}/g, config.evolution_api_url)
      workflowString = workflowString.replace(/\{\{EVOLUTION_API_KEY\}\}/g, config.evolution_api_key)
      workflowString = workflowString.replace(/\{\{GEMINI_API_KEY\}\}/g, config.gemini_api_key)

      const processedWorkflow = JSON.parse(workflowString)

      // 3. Criar workflow no n8n
      const response = await fetch(`${config.n8n_url}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': config.n8n_api_key
        },
        body: JSON.stringify({
          name: workflow.name,
          nodes: processedWorkflow.nodes,
          connections: processedWorkflow.connections,
          active: true,
          settings: processedWorkflow.settings
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar workflow')
      }

      const createdWorkflow = await response.json()

      toast.success(`✅ ${workflow.name} instalado com sucesso!`)

      // Atualizar status
      setWorkflows(prev =>
        prev.map(w =>
          w.id === workflow.id ? { ...w, installed: true } : w
        )
      )

    } catch (error: any) {
      console.error('Erro ao instalar workflow:', error)
      toast.error('Erro: ' + error.message)
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Zap className="h-8 w-8 text-purple-600" />
          Automação com n8n
        </h1>
        <p className="text-gray-500 mt-1">
          Importe workflows prontos com 1 clique e automatize seu atendimento
        </p>
      </div>

      {/* Configuração do n8n */}
      <Card>
        <CardHeader>
          <CardTitle>1️⃣ Configuração do n8n</CardTitle>
          <CardDescription>
            Configure a conexão com seu servidor n8n
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n8n_url">URL do n8n</Label>
              <Input
                id="n8n_url"
                value={config.n8n_url}
                onChange={e => setConfig(prev => ({ ...prev, n8n_url: e.target.value }))}
                placeholder="https://seu-n8n.com"
              />
              <p className="text-xs text-gray-500">
                Exemplo: https://n8n.exemplo.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="n8n_api_key">API Key do n8n</Label>
              <Input
                id="n8n_api_key"
                type="password"
                value={config.n8n_api_key}
                onChange={e => setConfig(prev => ({ ...prev, n8n_api_key: e.target.value }))}
                placeholder="n8n_api_xxxxxxxxxx"
              />
              <p className="text-xs text-gray-500">
                Crie em: Configurações → API do n8n
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gemini_api_key">Google Gemini API Key (para IA)</Label>
            <Input
              id="gemini_api_key"
              type="password"
              value={config.gemini_api_key}
              onChange={e => setConfig(prev => ({ ...prev, gemini_api_key: e.target.value }))}
              placeholder="AIza..."
            />
            <p className="text-xs text-gray-500">
              Obtenha em: <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-purple-600 hover:underline">Google AI Studio</a>
            </p>
          </div>

          <Button onClick={handleSaveConfig} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando Conexão...
              </>
            ) : configSaved ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Configuração Salva
              </>
            ) : (
              'Salvar e Testar Conexão'
            )}
          </Button>

          {configSaved && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Conexão com n8n estabelecida com sucesso!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Workflows Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>2️⃣ Workflows Disponíveis</CardTitle>
          <CardDescription>
            Clique em "Instalar" para importar o workflow automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              className="border rounded-lg p-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="text-4xl">{workflow.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {workflow.name}
                    {workflow.installed && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Instalado
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {workflow.description}
                  </p>
                  <p className="text-xs text-purple-700 font-medium mt-2">
                    Segmentos: {workflow.segments.join(' • ')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {workflow.installed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`${config.n8n_url}/workflow/${workflow.id}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no n8n
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleInstallWorkflow(workflow)}
                    disabled={!configSaved || installing === workflow.id}
                  >
                    {installing === workflow.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Instalando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Instalar Workflow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Como funciona:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Configure a URL e API Key do seu servidor n8n</li>
            <li>Clique em "Instalar Workflow" no workflow desejado</li>
            <li>O sistema automaticamente configura todas as credenciais (Supabase, Evolution, Gemini)</li>
            <li>O workflow já fica ativo e funcionando!</li>
            <li>Você pode editar ou personalizar depois no n8n</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
