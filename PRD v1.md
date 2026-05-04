---
created: 2026-05-03
type: referência
tags: [prd, mvp, especificacao]
---

# PRD — Gerador de Orçamentos para PMEs (MVP v1)

## Contexto e objetivo

Construir um bot no Telegram que permite a prestadores de serviço autônomos (eletricistas, encanadores, pintores, instaladores) gerar orçamentos em PDF de forma rápida, direto pelo chat. O prestador descreve o serviço via mensagem de texto, a IA interpreta os dados, consulta a base de preços cadastrada pelo próprio prestador, monta o orçamento e devolve o PDF no chat.

Esta é a versão 1 do produto — apenas mensagens de texto, sem suporte a áudio ainda.

---

## Stack tecnológica

- **Frontend/Backend:** Next.js (App Router) com API Routes (TypeScript)
- **Deploy:** Vercel (plano gratuito)
- **Bot:** Telegram Bot API via webhook
- **IA:** Anthropic Claude API (modelo claude-sonnet-4-5 ou similar disponível)
- **Banco de dados:** Supabase (PostgreSQL) — plano gratuito
- **Geração de PDF:** `pdf-lib` ou `@react-pdf/renderer` (sem Puppeteer — incompatível com Vercel serverless)
- **Variáveis de ambiente:** gerenciadas pelo Vercel

---

## Arquitetura geral

```
Prestador (Telegram)
        │
        ▼
Telegram Webhook → POST /api/webhook (Vercel serverless function)
        │
        ├── Mensagem de onboarding → salva dados do prestador no Supabase
        ├── Atualização de preços → atualiza base de conhecimento no Supabase
        └── Pedido de orçamento → chama Claude API → gera PDF → envia arquivo via Telegram
```

---

## Banco de dados (Supabase)

### Tabela `prestadores`

| coluna | tipo | descrição |
|---|---|---|
| id | uuid (PK) | identificador único |
| telegram_id | bigint | ID do usuário no Telegram |
| nome | text | nome do prestador ou empresa |
| telefone | text | telefone para constar no orçamento |
| email | text | opcional |
| profissao | text | ex: eletricista, encanador |
| criado_em | timestamp | data de cadastro |

### Tabela `base_precos`

| coluna | tipo | descrição |
|---|---|---|
| id | uuid (PK) | identificador único |
| prestador_id | uuid (FK) | referência ao prestador |
| servico | text | nome do serviço ex: "instalação de tomada" |
| unidade | text | ex: "por ponto", "por hora", "por m²" |
| preco | numeric | valor em reais |
| observacoes | text | notas adicionais, opcional |
| atualizado_em | timestamp | última atualização |

### Tabela `orcamentos`

| coluna | tipo | descrição |
|---|---|---|
| id | uuid (PK) | identificador único |
| prestador_id | uuid (FK) | referência ao prestador |
| numero | integer | número sequencial do orçamento |
| descricao_original | text | mensagem original enviada pelo prestador |
| itens | jsonb | array de itens gerados pela IA |
| total | numeric | valor total do orçamento |
| pdf_url | text | URL do PDF gerado (storage Supabase) |
| criado_em | timestamp | data de geração |

### Tabela `estados_conversa`

| coluna | tipo | descrição |
|---|---|---|
| telegram_id | bigint (PK) | ID do usuário |
| estado | text | ex: `aguardando_nome`, `aguardando_profissao`, `aguardando_precos`, `ativo`, `aguardando_confirmacao` |
| contexto | jsonb | dados temporários da conversa (ex: orçamento pendente de confirmação) |
| atualizado_em | timestamp | última atualização |

---

## Fluxos do bot

### Fluxo 1 — Primeiro acesso (onboarding)

O bot detecta que o `telegram_id` não está cadastrado e inicia o onboarding:

```
Bot: Olá! Sou o assistente de orçamentos. Vamos configurar seu perfil.
     Qual é o seu nome ou nome da empresa?

Prestador: João Elétrica

Bot: Qual é a sua profissão principal?
     (ex: eletricista, encanador, pintor, instalador)

Prestador: eletricista

Bot: Qual é o seu telefone de contato?

Prestador: 11 99999-9999

Bot: Perfeito! Agora vamos cadastrar seus preços.
     Me diga seus serviços e valores no formato:
     "serviço | unidade | valor"

     Exemplos:
     instalação de tomada | por ponto | 80
     troca de disjuntor | por unidade | 150
     hora de mão de obra | por hora | 120

     Pode enviar vários de uma vez, um por linha.

Prestador: [envia lista de serviços]

Bot: Base de preços salva! ✅
     Agora é só me descrever o serviço que precisa orçar e eu gero o PDF.
```

### Fluxo 2 — Geração de orçamento

```
Prestador: preciso fazer um orçamento pra trocar o quadro de disjuntores
           de um apartamento, são 12 disjuntores, mais 3 tomadas novas
           e uma fiação geral

Bot: Entendi! Aqui está o resumo do orçamento que montei:

     📋 Orçamento #0042

     • Troca de disjuntor (12 un.) ........... R$ 1.800,00
     • Instalação de tomada (3 pts.) ......... R$ 240,00
     • Fiação geral .......................... R$ 350,00
     ─────────────────────────────────────────
     Total: R$ 2.390,00

     Confirma e gero o PDF? (sim/não)

Prestador: sim

Bot: [envia arquivo PDF do orçamento]
```

### Fluxo 3 — Atualização de preços

```
Prestador: /precos

Bot: Sua base de preços atual:
     [lista os serviços cadastrados]

     Para atualizar, envie no formato:
     "serviço | unidade | novo valor"

     Para adicionar novos serviços, envie normalmente.
     Para remover um serviço, envie: "remover: nome do serviço"
```

### Comandos do bot

| comando | descrição |
|---|---|
| `/start` | inicia o bot ou exibe boas-vindas se já cadastrado |
| `/precos` | exibe e permite editar a base de preços |
| `/perfil` | exibe e permite editar dados do prestador |
| `/ajuda` | exibe instruções de uso |

---

## Integração com Claude API

### Função de extração de itens do orçamento

A chamada à Claude API deve receber:

1. A mensagem do prestador descrevendo o serviço
2. A base de preços completa do prestador (como contexto)

**System prompt:**

```
Você é um assistente especializado em orçamentos para prestadores de serviço autônomos brasileiros.

Sua tarefa é analisar a descrição de um serviço enviada pelo prestador e montar os itens do orçamento com base na tabela de preços fornecida.

Responda APENAS com um JSON válido, sem texto adicional, sem markdown, sem blocos de código.

Formato da resposta:
{
  "itens": [
    {
      "descricao": "nome do serviço",
      "quantidade": número,
      "unidade": "unidade de medida",
      "preco_unitario": número,
      "subtotal": número
    }
  ],
  "total": número,
  "observacoes": "observações opcionais sobre o orçamento"
}

Regras:
- Use apenas serviços que existem na tabela de preços fornecida
- Se um serviço mencionado não tiver preço cadastrado, inclua com preco_unitario 0 e adicione uma observação
- Interprete quantidades mencionadas de forma natural (ex: "12 disjuntores" → quantidade: 12)
- Seja preciso nos cálculos: subtotal = quantidade × preco_unitario
- total = soma de todos os subtotais
- Responda em português brasileiro
```

**User prompt:**

```
Tabela de preços do prestador:
{base_de_precos_formatada}

Descrição do serviço a orçar:
{mensagem_do_prestador}
```

---

## Geração do PDF

O PDF deve conter:

- **Cabeçalho:** nome do prestador, profissão, telefone, data do orçamento, número do orçamento
- **Tabela de itens:** descrição, quantidade, unidade, valor unitário, subtotal
- **Total geral** em destaque
- **Rodapé:** validade do orçamento (padrão: 15 dias), observações se houver
- **Estilo:** limpo, profissional, preto e branco (compatível com impressão)

Usar `pdf-lib` para geração do PDF diretamente no servidor, sem dependências de browser (Puppeteer não é compatível com Vercel serverless).

O PDF gerado deve ser enviado diretamente como arquivo no Telegram usando `sendDocument`.

---

## Estrutura de arquivos do projeto

```
/
├── app/
│   └── api/
│       └── webhook/
│           └── route.ts          # recebe mensagens do Telegram
├── lib/
│   ├── telegram.ts               # funções para enviar mensagens, documentos
│   ├── claude.ts                 # integração com Claude API
│   ├── supabase.ts               # cliente Supabase e queries
│   ├── pdf.ts                    # geração do PDF com pdf-lib
│   └── bot/
│       ├── onboarding.ts         # fluxo de cadastro do prestador
│       ├── orcamento.ts          # fluxo de geração de orçamento
│       └── precos.ts             # fluxo de gestão de preços
├── types/
│   └── index.ts                  # tipagens TypeScript
├── .env.local                    # variáveis de ambiente (não commitar)
└── package.json
```

---

## Variáveis de ambiente necessárias

```env
TELEGRAM_BOT_TOKEN=         # token do BotFather
TELEGRAM_WEBHOOK_SECRET=    # string aleatória para validar requisições
ANTHROPIC_API_KEY=          # chave da API do Claude
NEXT_PUBLIC_SUPABASE_URL=   # URL do projeto Supabase
SUPABASE_SERVICE_ROLE_KEY=  # chave de serviço Supabase (acesso total)
```

---

## Configuração do webhook do Telegram

Após o deploy na Vercel, registrar o webhook:

```
https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://seu-projeto.vercel.app/api/webhook&secret_token={WEBHOOK_SECRET}
```

A rota `/api/webhook` deve validar o header `X-Telegram-Bot-Api-Secret-Token` antes de processar qualquer requisição.

---

## Estados de conversa

Como o Vercel é serverless (sem memória entre requisições), o estado da conversa de cada usuário deve ser salvo no Supabase, na tabela `estados_conversa`.

---

## Regras de negócio

- Cada prestador tem sua própria base de preços isolada
- O número do orçamento é sequencial por prestador (começa em 1)
- Orçamento só é gerado se o prestador tiver ao menos 1 serviço cadastrado na base de preços
- Se a IA não conseguir mapear nenhum item da descrição, o bot pede que o prestador reformule ou cadastre o serviço
- O bot responde apenas em português brasileiro
- Timeout de confirmação: se o prestador não confirmar em 10 minutos, o orçamento pendente é descartado

---

## O que está fora do escopo desta versão (v1)

- Suporte a áudios e transcrição (previsto para v2)
- Painel web de administração
- WhatsApp ou outros canais
- Múltiplos usuários por conta (ex: empresa com vários funcionários)
- Personalização visual do PDF (logo, cores)
- Envio automático do orçamento para o cliente final
- Pagamentos ou assinaturas

---

## Critérios de sucesso do MVP

- Prestador consegue se cadastrar e configurar sua base de preços em menos de 5 minutos
- Orçamento gerado em menos de 30 segundos após a descrição
- PDF gerado é profissional o suficiente para ser enviado a um cliente real
- Fluxo funciona de ponta a ponta sem erros para ao menos 3 tipos de serviço diferentes
