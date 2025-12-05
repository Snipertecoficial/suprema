import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Sparkles, Zap, Shield, Workflow, CreditCard, BarChart2, MessageSquare } from 'lucide-react'

const benefits = [
    {
        title: 'Automação n8n pronta para Salões e Clínicas',
        description: 'Fluxos para lembretes, follow-up de faltas, reativações e vendas guiadas com WhatsApp humano.',
        icon: Workflow
    },
    {
        title: 'Super admin completo',
        description: 'Controle unidades, assinaturas Stripe, permissões e auditoria em um cockpit único.',
        icon: Shield
    },
    {
        title: 'POS + Comanda omnichannel',
        description: 'Vendas com múltiplos pagamentos, comandas em grupo e cálculo automático de comissão.',
        icon: CreditCard
    },
    {
        title: 'Agenda 24/7 com link de reservas',
        description: 'Página de agendamento online com profissionais e serviços configuráveis por unidade.',
        icon: BarChart2
    }
]

const proofPoints = [
    'Agende + confirme via WhatsApp em minutos',
    'Stripe nativo para cobrar planos e reativar assinaturas',
    'Fluxos segmentados para beleza, estética, podologia e barbearias',
    'Dados seguros com Supabase e políticas de acesso por unidade'
]

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="max-w-6xl mx-auto px-4 pt-16 pb-20">
                <section className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 text-sm text-indigo-200 ring-1 ring-indigo-500/40">
                            <Sparkles className="w-4 h-4" />
                            Plataforma SaaS para salões, clínicas e barbearias
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                            Mais agendamentos, vendas e retenção com automações nativas em n8n
                        </h1>
                        <p className="text-lg text-slate-200 max-w-2xl">
                            Tenha um hub completo: agenda 24/7, POS com comanda eletrônica, fidelidade e comissionamento, tudo
                            integrado ao seu CRM multi-unidade, com Stripe e automações prontas para WhatsApp.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button size="lg" className="bg-indigo-500 hover:bg-indigo-400 text-white">
                                Começar agora
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                            <Button size="lg" variant="outline" className="border-indigo-400 text-indigo-200 hover:bg-indigo-900/40">
                                Ver automações n8n
                                <Zap className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {proofPoints.map(point => (
                                <div key={point} className="flex items-center gap-3 text-sm text-slate-200 bg-slate-800/60 px-4 py-3 rounded-xl ring-1 ring-white/5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 blur-3xl bg-indigo-500/30" aria-hidden />
                        <div className="relative rounded-3xl bg-slate-900/70 ring-1 ring-white/10 p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-indigo-100">Cockpit do super admin</div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs">Stripe + Supabase</div>
                            </div>
                            <div className="space-y-4 text-sm text-slate-200">
                                <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Receita recorrente</p>
                                        <p className="text-xl font-semibold text-white">R$ 124.820</p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3" /> +18% mês</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-slate-800/60">
                                        <p className="text-xs text-slate-400">Workflows ativos</p>
                                        <p className="text-lg font-semibold text-white">27</p>
                                        <p className="text-xs text-emerald-300 mt-1">WhatsApp + n8n</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-800/60">
                                        <p className="text-xs text-slate-400">Assinaturas</p>
                                        <p className="text-lg font-semibold text-white">482</p>
                                        <p className="text-xs text-indigo-200 mt-1">Stripe Billing</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/60 flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-indigo-300" />
                                    <div>
                                        <p className="text-sm font-semibold">Reativações automáticas</p>
                                        <p className="text-xs text-slate-400">Fluxos de WhatsApp humano para clientes inativos e aniversariantes.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-3 rounded-xl bg-slate-800/60">Comandas<br /><span className="text-lg font-semibold text-white">1.284</span></div>
                                    <div className="p-3 rounded-xl bg-slate-800/60">Agendamentos<br /><span className="text-lg font-semibold text-white">3.912</span></div>
                                    <div className="p-3 rounded-xl bg-slate-800/60">Pontuação fidelidade<br /><span className="text-lg font-semibold text-white">8.4M</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-20">
                    <div className="grid lg:grid-cols-2 gap-10 items-start">
                        <div className="space-y-4">
                            <p className="text-indigo-200 text-sm font-semibold">Por que migrar agora?</p>
                            <h2 className="text-3xl font-bold">Feito para operações de alto volume e ticket médio elevado</h2>
                            <p className="text-slate-200 max-w-2xl">
                                Unifique agenda, caixa, estoque, fidelidade e comissionamento enquanto mantém seus dados seguros por unidade. As automações em n8n vêm prontas para as jornadas mais valiosas: confirmação, lembrete, faltou, reativação e remarketing.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {benefits.map(item => (
                                <div key={item.title} className="p-5 rounded-2xl bg-slate-900/70 ring-1 ring-white/5 space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-200">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{item.title}</h3>
                                    <p className="text-sm text-slate-300">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-16 grid lg:grid-cols-3 gap-6">
                    {[{
                        title: 'Automação que vende',
                        description: 'Workflows para agendamento, confirmação, reengajamento e pagamento enviando links Stripe ou cobranças recorrentes.',
                        icon: Zap
                    }, {
                        title: 'Configuração guiada',
                        description: 'Importe os fluxos n8n do diretório público e publique sem código. Conectores prontos para Evolution API e Supabase.',
                        icon: Sparkles
                    }, {
                        title: 'Segurança e auditoria',
                        description: 'Permissões por perfil, trilhas de auditoria e RLS no Supabase para manter cada unidade isolada e em conformidade.',
                        icon: Shield
                    }].map(card => (
                        <div key={card.title} className="p-6 rounded-2xl bg-slate-900/70 ring-1 ring-white/5 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-200">
                                <card.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold">{card.title}</h3>
                            <p className="text-slate-300 text-sm">{card.description}</p>
                        </div>
                    ))}
                </section>

                <section className="mt-16 bg-slate-900/70 ring-1 ring-white/5 rounded-3xl p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <h3 className="text-2xl font-semibold">Pronto para lançar em produção</h3>
                        <p className="text-slate-200 text-sm">
                            Ative Stripe, conecte suas chaves Supabase e publique os fluxos n8n do diretório <code>public/n8n-workflows</code>.
                            Em minutos você terá agenda 24/7, automações de WhatsApp humano e um cockpit de super admin operando com dados reais.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white">
                            Falar com consultor
                        </Button>
                        <Button size="lg" variant="outline" className="border-indigo-400 text-indigo-200 hover:bg-indigo-900/40">
                            Ver demo
                        </Button>
                    </div>
                </section>
            </div>
        </main>
    )
}
