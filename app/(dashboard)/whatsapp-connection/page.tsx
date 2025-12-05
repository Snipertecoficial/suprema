'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smartphone, CheckCircle2, XCircle, RefreshCw, QrCode, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import * as EvolutionAPI from '@/lib/services/evolutionAPI'
import { toast } from 'sonner'

export default function WhatsAppConnectionPage() {
    const supabase = createClient()
    const [isConnected, setIsConnected] = useState(false)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(true) // Start loading
    const [instanceName, setInstanceName] = useState<string>('')
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
    const [lastActivity, setLastActivity] = useState<string | null>(null)
    const [configValid, setConfigValid] = useState(true)
    const [unitId, setUnitId] = useState<string | null>(null)

    // 1. Inicialização: Validar config e buscar instância do cliente
    useEffect(() => {
        const init = async () => {
            // Validar config básica (URL e Key)
            const validation = EvolutionAPI.validateConfig()
            setConfigValid(validation.isValid)

            if (!validation.isValid) {
                console.error('⚠️ Configuração inválida:', validation.errors)
                toast.error('Variáveis de ambiente não configuradas. Veja o console.')
                setLoading(false)
                return
            }

            try {
                // Buscar usuário e unidade
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('unit_id')
                    .eq('id', user.id)
                    .single()

                if (!profile?.unit_id) {
                    toast.error('Usuário não vinculado a uma unidade.')
                    setLoading(false)
                    return
                }

                setUnitId(profile.unit_id)

                // Buscar dados da unidade
                const { data: unit } = await supabase
                    .from('units')
                    .select('whatsapp_instance_name, slug, name')
                    .eq('id', profile.unit_id)
                    .single()

                let currentInstanceName = unit?.whatsapp_instance_name

                // Se não tiver instance_name, gerar um automaticamente
                if (!currentInstanceName && unit) {
                    // Gerar slug único baseado no nome da unidade
                    let slug = unit.slug || unit.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
                    
                    // Garantir que slug seja único (adicionar timestamp se necessário)
                    if (!slug) {
                        slug = `unit-${Date.now()}`
                    }
                    
                    // Nome da instância: crm-{slug} (ex: crm-beto-style)
                    currentInstanceName = `crm-${slug}`

                    // Salvar no banco
                    const { error: updateError } = await supabase
                        .from('units')
                        .update({
                            whatsapp_instance_name: currentInstanceName,
                            slug: slug
                        })
                        .eq('id', profile.unit_id)

                    if (updateError) {
                        console.error('Erro ao salvar instance_name:', updateError)
                    } else {
                        console.log('🆕 Nova instância gerada:', currentInstanceName)
                    }
                }

                if (currentInstanceName) {
                    setInstanceName(currentInstanceName)
                    // Agora que temos o nome, verificar conexão
                    await checkConnection(currentInstanceName)
                    setupWebhook(currentInstanceName)
                }

            } catch (error) {
                console.error('Erro na inicialização:', error)
                toast.error('Erro ao carregar dados da unidade.')
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [])

    // Polling de status a cada 5 segundos quando conectado
    useEffect(() => {
        if (!isConnected || !instanceName) return

        const interval = setInterval(() => {
            checkConnection(instanceName)
        }, 5000)

        return () => clearInterval(interval)
    }, [isConnected, instanceName])

    const checkConnection = async (targetInstanceName: string = instanceName) => {
        if (!targetInstanceName) return

        try {
            // Verificar status na Evolution API
            const status = await EvolutionAPI.getConnectionStatus(targetInstanceName)

            // Verificar se houve erro na resposta (404 = instância não existe)
            if (status.error) {
                // Se erro 404, instância foi deletada - permitir recriar
                setIsConnected(false)
                setQrCode(null) // Limpar QR code antigo
                return
            }

            const connected = status.state === 'open'
            setIsConnected(connected)

            if (connected && status.instance?.phoneNumber) {
                setPhoneNumber(status.instance.phoneNumber)

                // Atualizar status no banco units
                if (unitId) {
                    await supabase
                        .from('units')
                        .update({
                            whatsapp_connected: true,
                            whatsapp_phone: status.instance.phoneNumber
                        })
                        .eq('id', unitId)
                }

                // Sincronizar com whatsapp_instances
                await supabase
                    .from('whatsapp_instances')
                    .upsert({
                        instance_name: targetInstanceName,
                        unit_id: unitId,
                        status: 'open',
                        phone_number: status.instance.phoneNumber,
                        connected_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'instance_name'
                    })
            } else if (!connected) {
                // Se desconectado, atualizar status
                if (unitId) {
                    await supabase
                        .from('units')
                        .update({
                            whatsapp_connected: false
                        })
                        .eq('id', unitId)
                }

                // Atualizar whatsapp_instances
                await supabase
                    .from('whatsapp_instances')
                    .upsert({
                        instance_name: targetInstanceName,
                        unit_id: unitId,
                        status: status.state || 'close',
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'instance_name'
                    })
            }

            // Buscar dados do banco (tabela whatsapp_instances para histórico)
            const { data: instance } = await supabase
                .from('whatsapp_instances')
                .select('*')
                .eq('instance_name', targetInstanceName)
                .single()

            if (instance) {
                setLastActivity(instance.updated_at || instance.created_at)
                if (instance.phone_number && !phoneNumber) {
                    setPhoneNumber(instance.phone_number)
                }
            }

        } catch (error: any) {
            console.error('Erro ao verificar conexão:', error)
            setIsConnected(false)
        }
    }

    const resetInstance = async () => {
        if (!instanceName) {
            toast.error('Instância não configurada.')
            return
        }

        if (!confirm('Isso irá deletar a instância atual e criar uma nova.\n\nVocê precisará escanear um novo QR Code.\n\nContinuar?')) {
            return
        }

        setLoading(true)

        try {
            // Tentar deletar instância existente no Evolution
            try {
                await EvolutionAPI.disconnectInstance(instanceName)
                console.log('✅ Instância deletada no Evolution')
            } catch (error) {
                console.log('⚠️ Instância não existia ou erro ao deletar (OK, continuando...)')
            }

            // Limpar estado local
            setIsConnected(false)
            setQrCode(null)
            setPhoneNumber(null)

            // Atualizar banco
            await supabase
                .from('whatsapp_instances')
                .update({
                    status: 'disconnected',
                    phone_number: null,
                    connected_at: null
                })
                .eq('instance_name', instanceName)

            toast.success('Instância resetada! Clique em "Gerar QR Code" para reconectar.')

        } catch (error: any) {
            console.error('Erro ao resetar instância:', error)
            toast.error('Erro: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const generateQRCode = async () => {
        if (!instanceName || !unitId) {
            toast.error('Configuração incompleta. Recarregue a página.')
            return
        }

        setLoading(true)
        setQrCode(null)

        try {
            // 1. Criar ou conectar a instância no Evolution API
            let result = await EvolutionAPI.connectInstance(instanceName)

            // 2. Se não retornou QR Code e não está conectada, buscar QR Code explicitamente
            if (!result.qrcode?.base64 && result.status !== 'open') {
                console.log('ℹ️ Instância existe mas sem QR Code. Buscando QR Code...')
                try {
                    const qrData = await EvolutionAPI.getQRCode(instanceName)
                    if (qrData?.qrcode?.base64) {
                        result = { ...result, qrcode: qrData.qrcode }
                    }
                } catch (err) {
                    console.error('Erro ao buscar QR Code:', err)
                }
            }

            // 3. Sincronizar com banco de dados
            await supabase
                .from('whatsapp_instances')
                .upsert({
                    instance_name: instanceName,
                    unit_id: unitId,
                    status: result.status || 'connecting',
                    qrcode: result.qrcode?.base64 || null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'instance_name'
                })

            // 4. Exibir QR Code se disponível
            if (result.qrcode?.base64) {
                setQrCode(result.qrcode.base64)
                toast.success('QR Code gerado! Escaneie com seu WhatsApp.')

                // 5. Configurar webhook automaticamente
                await setupWebhook(instanceName)

                // 6. Polling para verificar se conectou (atualiza a cada 2 segundos)
                let pollAttempts = 0
                const maxAttempts = 60 // 120 segundos total (60 tentativas x 2s)
                
                const pollInterval = setInterval(async () => {
                    pollAttempts++
                    
                    try {
                        const status = await EvolutionAPI.getConnectionStatus(instanceName)
                        
                        if (status.state === 'open') {
                            clearInterval(pollInterval)
                            setIsConnected(true)
                            setQrCode(null)
                            toast.success('WhatsApp conectado com sucesso! 🎉')
                            
                            // Atualizar banco e configurar webhook
                            await checkConnection(instanceName)
                            await setupWebhook(instanceName)
                        } else if (status.state === 'close' && pollAttempts > 5) {
                            // Se está fechado há várias tentativas, pode ter expirado
                            // Mas não limpar QR Code ainda, deixar tentar mais
                        }
                        
                        // Parar após maxAttempts
                        if (pollAttempts >= maxAttempts) {
                            clearInterval(pollInterval)
                            if (!isConnected) {
                                // QR Code pode ter expirado, mas não remover
                                // Cliente pode tentar atualizar manualmente
                            }
                        }
                    } catch (error) {
                        console.error('Erro no polling:', error)
                        // Continuar tentando
                    }
                }, 2000)
            } else {
                // Já está conectado
                if (result.status === 'open') {
                    setIsConnected(true)
                    toast.info('WhatsApp já está conectado!')
                    await checkConnection(instanceName)
                    await setupWebhook(instanceName)
                } else {
                    toast.error('Não foi possível gerar o QR Code. Tente novamente.')
                }
            }

        } catch (error: any) {
            console.error('Erro ao gerar QR Code:', error)
            toast.error('Erro ao gerar QR Code: ' + (error.message || 'Erro desconhecido'))
        } finally {
            setLoading(false)
        }
    }

    const disconnectWhatsApp = async () => {
        if (!confirm('Tem certeza que deseja desconectar o WhatsApp?\n\nVocê poderá reconectar a qualquer momento gerando um novo QR Code.')) return

        if (!instanceName) {
            toast.error('Instância não configurada.')
            return
        }

        setLoading(true)
        try {
            // Desconectar no Evolution API (faz logout)
            await EvolutionAPI.disconnectInstance(instanceName)
            
            setIsConnected(false)
            setQrCode(null)
            setPhoneNumber(null)

            // Atualizar banco de dados
            if (unitId) {
                await supabase
                    .from('units')
                    .update({
                        whatsapp_connected: false,
                        whatsapp_phone: null
                    })
                    .eq('id', unitId)

                // Atualizar whatsapp_instances
                await supabase
                    .from('whatsapp_instances')
                    .upsert({
                        instance_name: instanceName,
                        unit_id: unitId,
                        status: 'close',
                        disconnected_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'instance_name'
                    })
            }

            toast.success('WhatsApp desconectado! Você pode reconectar a qualquer momento.')
        } catch (error: any) {
            console.error('Erro ao desconectar:', error)
            toast.error('Erro ao desconectar: ' + (error.message || 'Erro desconhecido'))
        } finally {
            setLoading(false)
        }
    }

    const reconnectWhatsApp = async () => {
        // Reconectar = gerar novo QR Code
        await generateQRCode()
    }

    const setupWebhook = async (targetInstanceName: string) => {
        try {
            const webhookUrl = `${window.location.origin}/api/webhooks/evolution`
            await EvolutionAPI.setWebhook(webhookUrl, targetInstanceName)
            console.log('✅ Webhook configurado:', webhookUrl)
        } catch (error: any) {
            // Erro já foi logado no service com detalhes
            // Apenas mostrar toast genérico se necessário
            console.warn('⚠️ Não foi possível configurar webhook automaticamente')
            // Não mostrar toast pois não é crítico para o funcionamento
        }
    }

    const testWebhook = async () => {
        try {
            const response = await fetch('/api/webhooks/evolution')
            const data = await response.json()

            if (data.status === 'ok') {
                toast.success('Webhook está funcionando!')
            }
        } catch (error) {
            toast.error('Webhook não está acessível')
        }
    }

    if (!configValid) {
        return (
            <div className="p-8 space-y-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Configuração Incompleta</strong>
                        <p className="mt-2">As seguintes variáveis de ambiente não estão configuradas:</p>
                        <ul className="list-disc list-inside mt-2 text-sm">
                            {EvolutionAPI.validateConfig().errors.map((error, i) => (
                                <li key={i}>{error}</li>
                            ))}
                        </ul>
                        <p className="mt-3 text-sm">
                            Configure as variáveis no arquivo <code className="bg-gray-800 px-2 py-1 rounded">.env.local</code>
                        </p>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (loading && !instanceName) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando configurações da unidade...</span>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Conexão WhatsApp</h1>
                <p className="text-gray-500">Gerencie a conexão do WhatsApp Business com o CRM</p>
            </div>

            {/* Status da Conexão */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Status da Conexão
                            </CardTitle>
                            <CardDescription>
                                Instância: <span className="font-mono bg-gray-100 px-1 rounded">{instanceName}</span>
                            </CardDescription>
                        </div>
                        <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-600' : 'bg-gray-500'}>
                            {isConnected ? (
                                <>
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Conectado
                                </>
                            ) : (
                                <>
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Desconectado
                                </>
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isConnected && !qrCode && (
                        <Alert>
                            <AlertDescription>
                                O WhatsApp não está conectado. Clique no botão abaixo para gerar um QR Code e conectar seu dispositivo.
                            </AlertDescription>
                        </Alert>
                    )}

                    {isConnected && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-green-900">WhatsApp Conectado com Sucesso!</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        Seu CRM está recebendo e enviando mensagens automaticamente.
                                    </p>
                                    {phoneNumber && (
                                        <p className="text-sm text-green-600 mt-2">
                                            📱 Número: {phoneNumber}
                                        </p>
                                    )}
                                    {lastActivity && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Última atividade: {new Date(lastActivity).toLocaleString('pt-BR')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {qrCode && !isConnected && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900 font-medium mb-2">
                                    📱 Escaneie o QR Code com seu WhatsApp
                                </p>
                                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                    <li>Abra o WhatsApp no seu celular</li>
                                    <li>Toque em <strong>Mais opções</strong> (⋮) ou <strong>Configurações</strong></li>
                                    <li>Toque em <strong>Aparelhos conectados</strong></li>
                                    <li>Toque em <strong>Conectar um aparelho</strong></li>
                                    <li>Aponte seu celular para esta tela para escanear o código</li>
                                </ol>
                            </div>

                            <div className="flex justify-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                                {loading ? (
                                    <div className="text-center">
                                        <RefreshCw className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500">Aguardando conexão...</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center mb-3 border">
                                            <img src={qrCode} alt="QR Code WhatsApp" className="w-full h-full p-2" />
                                        </div>
                                        <p className="text-xs text-gray-500">QR Code válido por 60 segundos</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={generateQRCode}
                                            className="mt-3"
                                            disabled={loading}
                                        >
                                            <RefreshCw className="mr-2 h-3 w-3" />
                                            Atualizar QR Code
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                        {!isConnected && !qrCode && (
                            <Button
                                onClick={generateQRCode}
                                disabled={loading || !instanceName}
                                className="bg-[#00a884] hover:bg-[#008f6f] text-white"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Gerando QR Code...
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="mr-2 h-4 w-4" />
                                        Conectar WhatsApp
                                    </>
                                )}
                            </Button>
                        )}

                        {qrCode && !isConnected && (
                            <Button
                                onClick={generateQRCode}
                                variant="outline"
                                disabled={loading}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Atualizar QR Code
                            </Button>
                        )}

                        {/* Botão Resetar (sempre disponível quando há instanceName) */}
                        {instanceName && (
                            <Button
                                onClick={resetInstance}
                                variant="destructive"
                                size="sm"
                                disabled={loading}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Resetar Conexão
                            </Button>
                        )}

                        {isConnected && (
                            <>
                                <Button
                                    onClick={disconnectWhatsApp}
                                    variant="destructive"
                                    disabled={loading}
                                >
                                    Desconectar WhatsApp
                                </Button>
                                <Button
                                    onClick={reconnectWhatsApp}
                                    variant="outline"
                                    disabled={loading}
                                >
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Reconectar
                                </Button>
                            </>
                        )}

                        <Button
                            onClick={() => checkConnection(instanceName)}
                            variant="outline"
                            disabled={loading || !instanceName}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Verificar Status
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Informações Técnicas */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuração da Evolution API</CardTitle>
                    <CardDescription>Informações para integração</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700 mb-2">URL da API</p>
                        <code className="text-xs bg-white px-2 py-1 rounded border block">
                            {process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'Não configurada'}
                        </code>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700 mb-2">Webhook URL</p>
                        <code className="text-xs bg-white px-2 py-1 rounded border block">
                            {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/evolution` : '/api/webhooks/evolution'}
                        </code>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700 mb-2">Nome da Instância</p>
                        <code className="text-xs bg-white px-2 py-1 rounded border">
                            {instanceName || 'Carregando...'}
                        </code>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
