---
created: 2026-05-03
type: tarefa
status: ativo
tags: [projeto, tarefas]
projeto: "[[Gerador de Orçamentos para PMEs]]"
---

## Tarefas do projeto

- [ ] Configurar Infraestrutura Next.js e Supabase
      Criar app Next.js (App Router + TypeScript), conectar Vercel, criar projeto Supabase e provisionar as 4 tabelas (`prestadores`, `base_precos`, `orcamentos`, `estados_conversa`).

- [ ] Criar Bot Telegram e Configurar Webhook
      Criar bot via BotFather, implementar rota `/api/webhook` com validação do header `X-Telegram-Bot-Api-Secret-Token`, registrar webhook na URL do deploy da Vercel.

- [ ] Implementar Onboarding do Prestador
      Fluxo multi-step: capturar nome, profissão, telefone e base de preços inicial. Gerenciar estados (`aguardando_nome`, `aguardando_profissao`, `aguardando_telefone`, `aguardando_precos`, `ativo`) no Supabase.

- [ ] Implementar Fluxo de Geração de Orçamento
      Receber descrição do serviço, chamar Claude API com base de preços como contexto, parsear JSON de resposta, exibir resumo e aguardar confirmação (timeout 10 min).

- [ ] Implementar Geração de PDF com pdf-lib
      Gerar PDF com cabeçalho (prestador + data + número), tabela de itens, total em destaque e rodapé com validade de 15 dias. Enviar via `sendDocument` no Telegram. Salvar URL no Supabase.

- [ ] Implementar Gestão da Base de Preços
      Comandos `/precos`, `/perfil`, `/ajuda`, `/start`. Suporte a adicionar, atualizar e remover serviços da base de preços.

- [ ] Testar Fluxo Completo End-to-End
      Validar critérios do MVP com perfis de eletricista, encanador e pintor. Medir tempo de cadastro (<5 min) e geração de orçamento (<30 s). Revisar qualidade do PDF.
