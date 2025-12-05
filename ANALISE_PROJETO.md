# Análise do Projeto

## Visão geral
- **Framework:** Next.js com App Router (dependência `next` na versão 16.0.6) e React 19.2.0.
- **Linguagem:** TypeScript, com Tailwind CSS 4 para estilização.
- **Banco de dados:** Supabase (PostgreSQL) como backend principal.
- **Principais libs:** Radix UI para componentes de interface, Recharts para gráficos, Date-fns para datas e Sonner para notificações.

## Estrutura e integração com Supabase
- `lib/supabase.ts` expõe um cliente Supabase para uso no navegador, carregando URL e chave pública das variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/supabase/client.ts` e `lib/supabase/server.ts` oferecem fábricas específicas para cliente e servidor, preservando cookies em requisições server-side.
- `lib/supabase/middleware.ts` contém uma implementação avançada (atualmente não usada como middleware padrão) que aplica regras de rota, verifica sessão, perfil, assinatura e modo de manutenção diretamente via Supabase.
- `middleware.ts` na raiz está simplificado e apenas libera o tráfego; a autenticação efetiva ocorre em componentes/providers.

## Estado da autenticação
- O projeto depende das chaves públicas do Supabase para construir clientes tanto no browser quanto no servidor.
- O middleware avançado (`lib/supabase/middleware.ts`) sugere fluxo de sessão e autorização baseado em tabelas `profiles`, `subscriptions` e `system_settings`, incluindo redirecionamentos para login, onboarding e cobrança.

## Verificação de arquivos duplicados
- Foi executado um varrimento via hash SHA-256 em todo o repositório (exceto `.git` e `node_modules`).
- Nenhum arquivo duplicado foi encontrado na base de código monitorada.

## Próximos passos sugeridos
- Ativar ou remover a versão alternativa do middleware (`lib/supabase/middleware.ts`) para alinhar a estratégia de autenticação e evitar confusão.
- Completar a documentação de pastas mencionadas no README (por exemplo, `docs/`) ou ajustar o README para refletir a estrutura real.
