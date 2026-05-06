# Gerador de Orçamentos para PMEs — Instruções para o Claude

## O que é este projeto

Bot no Telegram que permite a prestadores de serviço autônomos (eletricistas, encanadores, pintores) gerar orçamentos em PDF diretamente pelo chat. O prestador descreve o serviço em linguagem natural, a IA interpreta, consulta a base de preços cadastrada e devolve o PDF no chat. Suporta ajustes em linguagem natural antes de confirmar o PDF.

## Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Deploy:** Vercel (serverless — sem memória entre requisições)
- **Bot:** Telegram Bot API via webhook
- **IA:** Anthropic Claude API (`claude-sonnet-4-5` ou similar)
- **Banco de dados:** Supabase (PostgreSQL)
- **PDF:** `pdf-lib` (nunca Puppeteer — incompatível com Vercel serverless)
- **Variáveis de ambiente:** gerenciadas pelo Vercel

## Estrutura de pastas

```
/
├── app/api/webhook/route.ts     # recebe mensagens do Telegram
├── lib/
│   ├── telegram.ts              # enviar mensagens e documentos
│   ├── claude.ts                # integração Claude API (Função 1 e 2)
│   ├── supabase.ts              # cliente e queries
│   ├── pdf.ts                   # geração do PDF
│   └── bot/
│       ├── onboarding.ts        # fluxo de cadastro
│       ├── orcamento.ts         # fluxo de geração de orçamento
│       ├── ajustes.ts           # fluxo de ajustes
│       └── precos.ts            # gestão de preços
├── types/index.ts
└── .env.local                   # NUNCA commitar
```

## Banco de dados (Supabase)

4 tabelas:
- **`prestadores`** — id, telegram_id, nome, telefone, email, profissao, criado_em
- **`base_precos`** — id, prestador_id (FK), servico, unidade, preco, observacoes, atualizado_em
- **`orcamentos`** — id, prestador_id (FK), numero, descricao_original, itens (jsonb), total, pdf_url, criado_em
- **`estados_conversa`** — telegram_id (PK), estado, contexto (jsonb), atualizado_em

**Estados possíveis:** `aguardando_nome` → `aguardando_profissao` → `aguardando_telefone` → `aguardando_precos` → `ativo` → `aguardando_confirmacao` → `aguardando_ajuste`

## Fluxo do bot

### Onboarding (primeiro acesso)
Detecta telegram_id não cadastrado → coleta nome, profissão, telefone, base de preços → salva no Supabase.

### Geração de orçamento
1. Prestador descreve o serviço em texto livre
2. Claude API (Função 1) extrai itens e monta JSON do orçamento
3. Bot exibe resumo + menu: 1️⃣ Confirmar e gerar PDF / 2️⃣ Ajustar / 3️⃣ Cancelar
4. Se ajuste: Claude API (Função 2) aplica a modificação em linguagem natural, volta ao menu (N rodadas possíveis)
5. Se confirmar: gera PDF com `pdf-lib` e envia via `sendDocument`
6. Timeout de 10 minutos de inatividade → descarta orçamento pendente, volta ao estado `ativo`

### Comandos do bot
- `/start` — boas-vindas ou onboarding
- `/precos` — visualizar/editar base de preços
- `/perfil` — visualizar/editar dados do prestador
- `/ajuda` — instruções de uso

## Integração com Claude API

### Função 1 — Geração do orçamento
- **Entrada:** mensagem do prestador + base de preços formatada
- **Saída:** JSON `{ itens: [...], total: number, observacoes: string }`
- Responder APENAS com JSON válido, sem markdown, sem blocos de código
- Usar apenas serviços existentes na base de preços; se não houver, incluir com `preco_unitario: 0` e observação

### Função 2 — Ajuste do orçamento
- **Entrada:** orçamento atual (JSON) + base de preços + instrução de ajuste em linguagem natural
- **Saída:** JSON atualizado no mesmo formato
- Tipos de ajuste: desconto percentual, valor fechado, remover item, ajustar quantidade, acrescentar item, ajustar preço unitário
- Manter itens não afetados exatamente como estão; recalcular total

## PDF (pdf-lib)

Conteúdo obrigatório:
- **Cabeçalho:** nome do prestador, profissão, telefone, data, número do orçamento (sequencial por prestador)
- **Tabela de itens:** descrição, quantidade, unidade, valor unitário, subtotal
- **Total** em destaque
- **Rodapé:** validade de 15 dias, observações se houver
- Estilo limpo, preto e branco, compatível com impressão

## Variáveis de ambiente

```
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Regras de Git

```
git checkout -b etapa-X-nome    # cria branch da etapa
# ... trabalha ...
git add .
git commit -m "feat: descrição"
git push origin etapa-X-nome
# abre PR no GitHub → merge na main
git checkout main && git pull origin main
```

- ⚠️ **Nunca commitar direto na `main`** (exceto Etapa 1 — já feita)
- ⚠️ **Nunca commitar `.env`**, tokens do Telegram, chaves Supabase ou Anthropic
- ⚠️ **Repositório público** — verificar `.gitignore` antes de qualquer `git add`

## Estado atual

- **Etapa concluída:** Etapa 1 — estrutura Next.js + dependências (commitada na `main`)
- **Próxima etapa:** Etapa 2 — Configuração do Supabase (branch: `etapa-2-supabase`)
- **Checklist completo:** `4 - Projetos\Gerador de Orçamentos para PMEs\Checklist.md`

## Regras de negócio

- Cada prestador tem base de preços isolada
- Número do orçamento é sequencial por prestador (começa em 1)
- Orçamento só é gerado se houver ao menos 1 serviço na base de preços
- Se a IA não mapear nenhum item, pedir que o prestador reformule ou cadastre o serviço
- Bot responde apenas em português brasileiro
- Fora do escopo v1: áudio, painel web, WhatsApp, múltiplos usuários por conta, logo no PDF, envio ao cliente final, pagamentos
