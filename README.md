# 🏢 CRM Multi-tenant SaaS

Sistema de CRM moderno e escalável para salões de beleza, clínicas e estabelecimentos similares.

## 🚀 Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **UI:** React + shadcn/ui + Tailwind CSS
- **WhatsApp:** Evolution API
- **Automação:** n8n (planejado)
- **IA:** Google Gemini (planejado)

## 📋 Features Principais

✅ **Gestão de Clientes** - Cadastro completo com segmentação  
✅ **Agendamento Online** - Sistema de bookings com lembretes automáticos  
✅ **WhatsApp Multi-tenant** - Cada cliente com sua própria instância  
✅ **Automação Plug-and-Play** - Lembretes e follow-ups automáticos  
✅ **Comanda Digital** - Controle de serviços e produtos  
✅ **Financeiro** - Gestão de pagamentos e comissões  
✅ **White Label** - Personalização de logo e cores  
🔄 **Chatbot Gemini** - Em desenvolvimento  

## 🏗️ Estrutura do Projeto

```
dashboard-crm/
├── app/              # Rotas e páginas (Next.js App Router)
├── components/       # Componentes reutilizáveis
├── lib/              # Services, utils e configurações
│   ├── services/     # Integrações (Evolution API, etc)
│   └── supabase/     # Cliente Supabase
├── types/            # Tipos TypeScript
├── database/         # 🗄️ Migrações SQL e scripts
│   ├── migrations/   # Scripts SQL executados no Supabase
│   └── scripts/      # Scripts Python de análise
├── docs/             # 📚 Documentação completa
│   ├── architecture/ # Arquitetura e decisões técnicas
│   └── features/     # Documentação de features
├── public/           # Assets estáticos
└── .env.local        # Variáveis de ambiente (não comitar!)
```

## 🛠️ Setup do Projeto

### 1. Clonar e Instalar

```bash
git clone <repo-url>
cd dashboard-crm
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

- Supabase URL e Keys
- Evolution API URL e Key

### 3. Executar Migrações do Banco

Acesse o [Supabase SQL Editor](https://supabase.com/dashboard) e execute os scripts em `database/migrations/` na ordem numérica.

Veja `database/README.md` para detalhes.

### 4. Rodar o Projeto

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## 📚 Documentação

Toda a documentação está organizada em `docs/`:

- **Arquitetura:** `docs/architecture/`
- **Features:** `docs/features/`
- **Migrações:** `database/README.md`

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/nova-feature`
2. Commit suas mudanças: `git commit -m 'Adiciona nova feature'`
3. Push para a branch: `git push origin feature/nova-feature`
4. Abra um Pull Request

## 📝 Licença

Proprietary - Todos os direitos reservados

## 🆘 Suporte

Para dúvidas ou problemas, consulte a documentação em `docs/` ou abra uma issue.

---

**Versão:** 1.0.0  
**Última atualização:** Dezembro 2025
