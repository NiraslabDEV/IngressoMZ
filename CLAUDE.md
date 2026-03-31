# Ingresso MZ

Plataforma de venda de ingressos para eventos em Moçambique (concertos, baladas, artes, teatro). Organizadores publicam eventos, compradores pagam via M-Pesa, e-Mola ou cartão. Cada ingresso tem QR code único para validação na entrada.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Banco de dados | PostgreSQL |
| ORM | Prisma |
| Autenticação | Auth.js (email+senha, Google, Apple) |
| Pagamentos | M-Pesa · e-Mola · Stripe (mockados na v1) |
| Email | Resend |
| QR Code | qrcode + nanoid |
| i18n | next-intl (PT + EN) |
| Estilização | Tailwind CSS + shadcn/ui |
| Deploy | Railway (PostgreSQL + app) |

---

## Modelo de Negócio

- **Taxa por ingresso vendido**: 5–10% configurável por evento (debitada do organizador)
- **Destaque na homepage**: pago pelo organizador para aparecer em posição privilegiada (modelo patrocinado)

---

## Estrutura de Diretórios

```
ingresso-mz/
├── CLAUDE.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── middleware.ts               # auth guard + i18n routing
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── messages/
│   ├── pt.json
│   └── en.json
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── page.tsx                    # homepage pública
│   │   │   ├── layout.tsx
│   │   │   ├── events/
│   │   │   │   └── [id]/page.tsx           # página do evento
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── organizer/                  # painel do organizador
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── events/
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── edit/page.tsx
│   │   │   │   │       └── checkin/page.tsx
│   │   │   └── buyer/                      # área do comprador
│   │   │       ├── tickets/page.tsx
│   │   │       └── orders/[id]/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── events/
│   │       │   ├── route.ts                # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts            # GET, PUT, DELETE
│   │       │       └── tiers/
│   │       │           ├── route.ts        # POST create tier
│   │       │           └── [tierId]/route.ts
│   │       ├── orders/
│   │       │   ├── route.ts                # POST create order
│   │       │   └── [id]/route.ts           # GET order + tickets
│   │       ├── payments/
│   │       │   ├── mpesa/route.ts
│   │       │   ├── emola/route.ts
│   │       │   ├── stripe/route.ts
│   │       │   └── webhooks/
│   │       │       ├── mpesa/route.ts
│   │       │       ├── emola/route.ts
│   │       │       └── stripe/route.ts
│   │       ├── tickets/
│   │       │   └── [token]/
│   │       │       ├── route.ts            # GET ticket by QR token
│   │       │       └── checkin/route.ts    # POST validate (organizer)
│   │       └── highlights/route.ts         # GET featured, POST create
│   ├── components/
│   │   ├── ui/                             # shadcn components
│   │   ├── events/
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   └── HighlightBadge.tsx
│   │   ├── tickets/
│   │   │   ├── QRTicket.tsx
│   │   │   └── CheckInScanner.tsx
│   │   └── payments/
│   │       └── PaymentSelector.tsx
│   ├── lib/
│   │   ├── auth.ts                         # Auth.js config (Google, Apple, credentials)
│   │   ├── db.ts                           # Prisma client singleton
│   │   ├── qr.ts                           # geração e verificação de tokens QR
│   │   ├── fee.ts                          # cálculo de taxa da plataforma
│   │   ├── email.ts                        # Resend: confirmação, QR code, cancelamento
│   │   └── payments/
│   │       ├── mpesa.ts                    # M-Pesa mock
│   │       ├── emola.ts                    # e-Mola mock
│   │       └── stripe.ts                   # Stripe
│   └── types/
│       └── index.ts
└── tests/
    ├── auth.test.ts
    ├── events.test.ts
    ├── orders.test.ts
    ├── payments.test.ts
    └── tickets.test.ts
```

---

## Entidades (Prisma Schema)

### User
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| name | string | |
| email | string | único |
| passwordHash | string? | null se login social |
| role | enum | BUYER · ORGANIZER · ADMIN |
| createdAt | datetime | |

### Event
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| organizerId | uuid | FK → User |
| title | string | |
| description | text | |
| venue | string | |
| startsAt | datetime | |
| endsAt | datetime? | |
| imageUrl | string? | |
| status | enum | DRAFT · PUBLISHED · CANCELLED · FINISHED |
| platformFeePercent | decimal | padrão 7.5% |
| createdAt | datetime | |

### TicketTier
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| eventId | uuid | FK → Event |
| name | string | ex: "VIP", "Normal", "Estudante" |
| price | decimal | em MZN |
| totalQty | int | quantidade total |
| soldQty | int | default 0 — controle de stock |
| salesEndAt | datetime? | |

### Order
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| buyerId | uuid | FK → User |
| eventId | uuid | FK → Event |
| status | enum | PENDING · PAID · CANCELLED · REFUNDED |
| totalAmount | decimal | |
| platformFee | decimal | |
| createdAt | datetime | |

### OrderItem
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| orderId | uuid | FK → Order |
| tierId | uuid | FK → TicketTier |
| quantity | int | |
| unitPrice | decimal | snapshot do preço no momento da compra |

### Ticket
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| orderId | uuid | FK → Order |
| tierId | uuid | FK → TicketTier |
| token | string | único, gerado com nanoid(32) — conteúdo do QR |
| status | enum | ACTIVE · USED · CANCELLED |
| checkedInAt | datetime? | |
| checkedInBy | uuid? | FK → User (organizador) |

### Payment
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| orderId | uuid | FK → Order |
| provider | enum | MPESA · EMOLA · STRIPE |
| providerRef | string? | referência externa |
| idempotencyKey | string | único — previne pagamento duplicado |
| amount | decimal | |
| status | enum | PENDING · COMPLETED · FAILED · REFUNDED |
| createdAt | datetime | |

### EventHighlight
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| eventId | uuid | FK → Event |
| startsAt | datetime | |
| endsAt | datetime | |
| position | int | ordem na homepage |
| paidAmount | decimal | |

---

## Variáveis de Ambiente (.env.example)

```env
# Database
DATABASE_URL=

# Auth.js
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Apple OAuth
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

# Resend
RESEND_API_KEY=
EMAIL_FROM=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# M-Pesa (mock na v1)
MPESA_API_KEY=
MPESA_BASE_URL=

# e-Mola (mock na v1)
EMOLA_API_KEY=
EMOLA_BASE_URL=

# App
NEXT_PUBLIC_APP_URL=
PLATFORM_FEE_PERCENT=7.5
```

---

## Decisões de Segurança

### Autenticação e Autorização
- Todos os endpoints de organizador exigem `role === ORGANIZER` validado server-side
- Organizador só acessa/edita eventos cujo `organizerId === session.user.id`
- Comprador só acessa tickets cujo `order.buyerId === session.user.id`
- Deny by default: acesso explicitamente concedido via verificação de ownership

### Tokens de QR Code
- Gerado com `nanoid(32)` — não sequencial, não derivável
- Não expõe ID interno do ticket no QR
- Check-in valida token + status `ACTIVE` + `event.startsAt` dentro da janela permitida

### Pagamentos
- `idempotencyKey` único por tentativa de pagamento — previne cobrança dupla
- `SELECT FOR UPDATE` no `TicketTier.soldQty` — previne overselling em race condition
- Webhooks validam assinatura criptográfica antes de processar (`stripe-signature`, HMAC para M-Pesa/e-Mola)
- Transação atômica: criar `Order` + decrementar `soldQty` + criar `Tickets` — tudo ou nada

### Inputs
- Validação server-side com Zod em todos os endpoints
- Tamanho máximo em campos de texto (ex: title 120 chars, description 2000 chars)
- Upload de imagem de evento: validar MIME type + magic bytes, armazenar no Cloudinary (fora do webroot), renomear com UUID

### Rate Limiting
- Rotas de auth: máx 10 req/min por IP
- Rota de check-in: máx 60 req/min por organizador

### Headers
- CORS restritivo: só `NEXT_PUBLIC_APP_URL`
- HTTPS obrigatório em produção
- Headers de segurança via `next.config.ts` (CSP, HSTS, X-Frame-Options)

### Logs
- Nunca logar senha, token de QR, dados de cartão
- Logar: login, logout, falha de auth, check-in, pagamento, acesso negado

---

## Integrações Externas

| Serviço | Uso | Status |
|---|---|---|
| M-Pesa (Vodacom MZ) | Pagamento mobile | Mock na v1 |
| e-Mola | Pagamento mobile | Mock na v1 |
| Stripe | Cartão de crédito/débito | Integrado |
| Resend | Emails transacionais | Integrado |
| Cloudinary | Upload de imagens de eventos | Integrado |
| Railway | Hosting + PostgreSQL gerenciado | Deploy |
