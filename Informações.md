---
created: 2026-05-03
type: projeto
status: ativo
tags: [projeto, claude-api, telegram, nextjs, supabase, ia]
---

## Objetivo
Construir um bot no Telegram que permita a prestadores de serviço autônomos (eletricistas, encanadores, pintores, instaladores) gerarem orçamentos profissionais em PDF de forma rápida — direto pelo chat, descrevendo o serviço por texto e recebendo o PDF pronto para enviar ao cliente.

**MVP v1:** apenas mensagens de texto, sem áudio ainda.

## Por que importa
- Validar de ponta a ponta a stack Claude API + Next.js + Supabase + Telegram
- Mercado real e dor clara: autônomos perdem negócios por não terem orçamentos profissionais
- Ticket acessível e volume alto de público-alvo permite validação rápida
- Primeiro projeto end-to-end do vault — referência para projetos futuros

## Stack
- **Frontend/Backend:** Next.js (App Router) + TypeScript
- **Deploy:** Vercel (plano gratuito)
- **Bot:** Telegram Bot API via webhook
- **IA:** Claude API (claude-sonnet-4-6 ou modelo equivalente)
- **Banco:** Supabase (PostgreSQL) — plano gratuito
- **PDF:** `pdf-lib` (compatível com serverless da Vercel)

## Próximos passos
1. Conectar GitHub ao Claude (tarefa [[Conectar GitHub ao Claude]] já criada) para versionar este projeto
2. Criar o repositório no GitHub
3. Subir o esqueleto do projeto Next.js
4. Atacar a primeira tarefa: infraestrutura

## Arquivos relacionados
- [[Tarefas]] — todas as tarefas do projeto
- [[PRD v1]] — especificação completa do MVP
- [[IA para Orçamentos de PMEs]] — ideia original
- [[Conectar GitHub ao Claude]] — pré-requisito para versionamento

## Critérios de sucesso do MVP
- Prestador consegue se cadastrar e configurar base de preços em menos de 5 minutos
- Orçamento gerado em menos de 30 segundos após a descrição
- PDF gerado é profissional o suficiente para enviar a cliente real
- Fluxo funciona end-to-end sem erros para ao menos 3 tipos de serviço diferentes

## Log de progresso
- **2026-05-03** — Projeto criado a partir do PRD v1
