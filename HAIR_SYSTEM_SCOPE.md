# Essência do produto e lacunas a cobrir (inspirado no Hair System / Nob)

Este documento resume o que o produto precisa entregar para salões, clínicas de estética, podologias e barbearias, tomando como referência o concorrente Hair System (Nob). Estrutura em módulos e sub-recursos para guiar implementação, testes e habilitação em produção.

## Por que os clientes precisam ver automações
- **Automação é o chamariz**: cada tenant deve ver e acionar facilmente as automações n8n (WhatsApp, agenda, confirmações, vendas).
- **Posicionamento**: comunicar que as automações cobrem confirmação/reconfirmação, recuperação de faltas, captura de leads, reativação de inadimplentes e bordo de agendamento online.
- **Distribuição**: menu visível no dashboard, CTAs dentro do fluxo de agenda/financeiro e onboarding que instala fluxos mínimos (confirmar agendamento, lembrete, cobrança Stripe de recorrência/faturas, anticancelamento).

## Visão por módulos (o que precisa existir para paridade com Hair System)

### 1) Caixa e Vendas (POS / Ponto de Venda)
- Pagamentos múltiplos na mesma venda (dinheiro + cartão + carteira interna/pontos).
- Comandas em grupo (várias comandas em um pagamento único) e comandas avulsas (sem agendamento).
- Cupons/recibos e fechamento diário de caixa; exportação CSV e impressão térmica.
- Integração nativa Stripe: intents para assinaturas do tenant e para vendas avulsas; suporte a reativação e cobrança de pendências.

### 2) Agenda / Agendamento Online
- Agenda multicoluna por profissional, com bloqueio de conflitos por duração do serviço e janela mínima.
- Booking link 24/7 (PWA/link), seleção de profissional com foto, serviços publicados/ocultos por regra.
- Confirmação manual/humana via WhatsApp Web e lembretes automáticos (WhatsApp e SMS opcional).
- Identificação do profissional no slot (foto/nome) e histórico de químicas do cliente acessível na ficha.

### 3) Comanda Eletrônica (Atendimento)
- Abrir/fechar comandas digitais; lançamento em tempo real de serviços e produtos por profissional.
- Permissões para reabrir, conceder desconto, remover item; agrupamento de comandas para checkout conjunto.
- Modo Venda Rápida (sem agenda) com cálculo de comissão e integração a estoque.

### 4) Estoque
- Produtos por unidade e fracionados (ml/g); baixa automática por ficha técnica.
- Diferenciar consumo interno x venda; ajustes manuais com log; alerta de estoque mínimo.

### 5) Financeiro (Contas a pagar/receber)
- Cadastro de despesas fixas e variáveis, alertas de vencimento e relatórios por período/categoria.
- Conciliação com caixa/Stripe; visão de pendências e inadimplentes por tenant.

### 6) Comissões
- Regras flexíveis por serviço/produto, cálculo bruto ou líquido de custos/taxas de cartão.
- Suporte a assistente/ajudante (split de comissão) e múltiplos profissionais por item.
- Consulta de comissão em tempo real no app do profissional.

### 7) Clientes e Fidelização
- Perfil completo com histórico de atendimentos/químicas, preferências e observações.
- Programa de pontos e conta corrente (créditos pré-pagos/vale-presente) integrados ao caixa.
- Pacotes e promoções configuráveis; filtros para marketing direto (VIP, aniversariantes, inativos X dias) com exportação.

### 8) Segurança e Auditoria
- Trilha de auditoria (quem criou/editou/excluiu agendamento, comanda, estoque, financeiro) com IP/actor.
- Permissões granulares por papel/unidade; backups automáticos (já coberto pelo Supabase) e segregação por tenant.

### 9) Multiunidade e Acesso
- Alternância entre unidades (filiais) dentro do mesmo tenant, mantendo segregação de dados.
- Acesso web e mobile (profissional/cliente) com interface responsiva.

### 10) Aplicativos (Profissional e Cliente)
- Profissional: agenda individual, lançamento em comanda, consulta de comissão e histórico de químicas.
- Cliente (PWA/link): agendamento sem instalação, exclusivo do salão, confirmação imediata, horários inteligentes e fotos dos profissionais.

### 11) Automação (n8n)
- Workflows packaged por segmento (Salões, Clínicas, Podologias, Barbearias) cobrindo: confirmação e reconfirmação de agendamentos, recuperação de faltas/no-show, reativação financeira (Stripe billing), captura de lead e pré-venda, onboarding digital, pesquisas NPS/CSAT.
- Conectores: Supabase, Evolution (WhatsApp), Stripe, Google Calendar.
- Playbooks: quando um agendamento é criado/alterado, disparar confirmação e atualizar card no CRM; quando pagamento falha, abrir ticket e notificar humano; quando estoque fica baixo, alertar compras.

## O que o Super Admin precisa enxergar
- Todos os fluxos de automação publicados e seu status de instalação por tenant.
- Integração Stripe: intents, reativações, planos, inadimplentes e histórico de falhas.
- Saúde de agenda/estoque/comissão (indicadores de conflito, estoque crítico, pagamentos pendentes) para suporte proativo.

## Próximos passos sugeridos
- Aplicar a migração `database/migrations/SQL_016_HAIR_SYSTEM_FOUNDATION.sql` no Supabase para criar fundações de POS, comanda, pagamentos múltiplos, fidelidade e auditoria.
- Expor automações no dashboard do cliente (CTA visível) e no super admin (status + reinstalar), além de fluxos de reconfirmação e cobrança automática.
- Implementar UI/flows para: booking link 24/7, comanda avulsa, múltiplos pagamentos, comissão flexível e programa de pontos/créditos.
- Wire n8n: acionar templates shipped em `public/n8n-workflows/`, instalar por tenant e atrelar a eventos de agenda/financeiro.
