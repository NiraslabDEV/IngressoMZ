# Ingresso MZ

Plataforma de venda de ingressos para eventos em Moçambique. Organizadores publicam eventos, compradores pagam via M-Pesa, e-Mola ou cartão, e recebem um QR code único para validação na entrada.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Base de dados**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma
- **Auth**: Auth.js v5 (email/senha, Google, Apple)
- **Pagamentos**: M-Pesa via e2Payments · e-Mola · Stripe
- **Deploy**: Vercel

## Começar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preenche o .env com as tuas credenciais

# Sincronizar a base de dados
npx prisma db push

# Servidor de desenvolvimento
npm run dev
```

## Comandos

```bash
npm run dev          # desenvolvimento local
npm run build        # build de produção
npm run typecheck    # verificar tipos TypeScript (correr antes de git push)
npm run test         # testes
npm run db:studio    # GUI da base de dados (Prisma Studio)
```

## Variáveis de Ambiente

Copia `.env.example` para `.env` e preenche:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL PostgreSQL (Neon) |
| `NEXTAUTH_SECRET` | Chave secreta Auth.js |
| `NEXTAUTH_URL` | URL da aplicação |
| `E2P_CLIENT_ID` | ID cliente e2Payments |
| `E2P_CLIENT_SECRET` | Chave secreta e2Payments |
| `E2P_WALLET_ID` | ID da carteira e2Payments |
| `STRIPE_SECRET_KEY` | Chave Stripe |
| `RESEND_API_KEY` | Chave Resend (emails) |
| `PLATFORM_FEE_PERCENT` | Taxa da plataforma (padrão: 7.5) |

## Estrutura de Papéis

| Papel | Acesso |
|---|---|
| `BUYER` | Comprar ingressos, ver os seus tickets e pedidos |
| `ORGANIZER` | Criar/gerir eventos, ver ganhos, fazer check-in |
| `ADMIN` | Gestão global (a implementar) |

## Fluxo de Pagamento M-Pesa

1. Comprador selecciona ingressos e número M-Pesa
2. API inicia pagamento via e2Payments (Explicador)
3. Comprador confirma no telemóvel
4. Frontend faz polling a `/api/payments/poll/[id]` de 5 em 5 segundos
5. Quando confirmado, ingressos com QR codes são gerados

## Repasse ao Organizador

O valor é recebido na conta e2Payments da plataforma. Após o evento:
- Dashboard mostra: receita bruta / taxa plataforma (7.5%) / valor líquido a receber
- Repasse feito manualmente via M-Pesa após o evento ser marcado como `FINISHED`
