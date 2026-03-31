# Ingresso MZ

Plataforma de venda de ingressos para eventos em Moçambique (concertos, baladas, artes, teatro). Organizadores publicam eventos, compradores pagam via M-Pesa, e-Mola ou cartão. Cada ingresso tem QR code único para validação na entrada.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Banco de dados | PostgreSQL (Neon — serverless) |
| ORM | Prisma 5 |
| Autenticação | Auth.js v5 beta (email+senha, Google, Apple) |
| Pagamentos | M-Pesa via e2Payments (real) · e-Mola (mock) · Stripe |
| Email | Resend |
| QR Code | qrcode + nanoid |
| i18n | next-intl (PT + EN) |
| Estilização | Tailwind CSS |
| Deploy | Vercel (app) + Neon (PostgreSQL) |

---

## Modelo de Negócio

- **Taxa por ingresso vendido**: 7.5% por defeito, configurável por evento — debitada do organizador
- **Repasse ao organizador**: manual após encerramento do evento, via M-Pesa. O dashboard mostra o valor líquido a receber.
- **Destaque na homepage**: pago pelo organizador para aparecer em posição privilegiada (modelo patrocinado)

---

## Estrutura de Diretórios (estado actual)

```
ingresso-mz/
├── CLAUDE.md
├── README.md
├── .env                          # NÃO commitar — credenciais reais
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.mjs               # sem output:standalone (Vercel)
├── tailwind.config.ts
├── postcss.config.js
├── middleware.ts                  # auth guard + i18n routing
├── prisma/
│   └── schema.prisma
├── messages/
│   ├── pt.json
│   └── en.json
├── src/
│   ├── i18n/
│   │   └── request.ts             # next-intl config
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx             # root layout (sem html/body — delegado ao locale)
│   │   ├── [locale]/
│   │   │   ├── layout.tsx         # html + body + navbar + NextIntlClientProvider
│   │   │   ├── page.tsx           # homepage: destaques + próximos eventos
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx  # selecção de papel: BUYER | ORGANIZER
│   │   │   ├── events/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # página do evento (SSR)
│   │   │   │       └── BuyTickets.tsx # fluxo de compra client-side + polling M-Pesa
│   │   │   ├── organizer/
│   │   │   │   ├── layout.tsx         # sidebar + protecção de rota ORGANIZER
│   │   │   │   ├── dashboard/page.tsx # ganhos: bruto / taxa / líquido por evento
│   │   │   │   └── events/
│   │   │   │       ├── page.tsx       # lista de eventos + barra de progresso
│   │   │   │       ├── new/page.tsx   # criar evento + lotes
│   │   │   │       └── [id]/
│   │   │   │           ├── edit/page.tsx    # editar + mudar status
│   │   │   │           └── checkin/page.tsx # validar QR (leitor USB ou manual)
│   │   │   └── buyer/
│   │   │       ├── tickets/page.tsx         # ingressos com QR codes gerados server-side
│   │   │       └── orders/[id]/page.tsx     # detalhe do pedido + QR codes
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts
│   │       │   └── register/route.ts        # aceita role: BUYER | ORGANIZER
│   │       ├── events/
│   │       │   ├── route.ts                 # GET list pública, POST criar (ORGANIZER)
│   │       │   └── [id]/route.ts            # GET (DRAFT visível só ao dono), PUT, DELETE
│   │       ├── orders/
│   │       │   ├── route.ts                 # POST criar order (transacção atómica)
│   │       │   └── [id]/route.ts            # GET order + tickets (só o comprador)
│   │       ├── payments/
│   │       │   ├── mpesa/route.ts           # inicia pagamento M-Pesa via e2Payments
│   │       │   ├── emola/route.ts           # mock e-Mola
│   │       │   ├── poll/[paymentId]/route.ts # polling de status (sem webhooks)
│   │       │   └── webhooks/
│   │       │       ├── mpesa/route.ts
│   │       │       └── stripe/route.ts
│   │       ├── tickets/
│   │       │   └── [token]/
│   │       │       ├── route.ts             # GET ticket by token
│   │       │       └── checkin/route.ts     # POST validar — janela 30min antes do evento
│   │       └── health/route.ts
│   ├── components/
│   │   └── organizer/
│   │       └── SignOutButton.tsx            # client component para signOut
│   └── lib/
│       ├── api.ts                           # AuthedSession type + requireRole + hasRole
│       ├── auth.ts                          # Auth.js config
│       ├── db.ts                            # Prisma singleton
│       └── payments/
│           ├── e2payments.ts                # M-Pesa real via e2Payments (Explicador)
│           ├── emola.ts                     # e-Mola mock
│           └── mpesa.ts                     # M-Pesa mock (substituído por e2payments)
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
| title | string | max 120 chars |
| description | text | max 2000 chars |
| venue | string | max 200 chars |
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
# Database (Neon PostgreSQL)
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

# e2Payments (Explicador) — gateway M-Pesa MZ real
E2P_CLIENT_ID=
E2P_CLIENT_SECRET=
E2P_WALLET_ID=

# e-Mola (mock na v1)
EMOLA_API_KEY=
EMOLA_BASE_URL=

# App
NEXT_PUBLIC_APP_URL=
PLATFORM_FEE_PERCENT=7.5
```

---

## Comandos Úteis

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run typecheck    # verificar erros TypeScript sem build (correr ANTES de git push)
npm run test         # testes
npm run db:studio    # Prisma Studio (GUI da base de dados)
npx prisma db push   # sincronizar schema com a base de dados (dev/staging)
npx prisma migrate deploy  # aplicar migrações em produção
```

---

## Decisões de Segurança

### Autenticação e Autorização
- Todos os endpoints de organizador exigem `role === ORGANIZER` validado server-side via `requireRole()`
- `AuthedSession` é um type guard — após `requireRole`, o TypeScript sabe que a sessão é válida
- Organizador só acessa/edita eventos cujo `organizerId === session.user.id`
- Comprador só acessa tickets cujo `order.buyerId === session.user.id`
- Deny by default: acesso explicitamente concedido via verificação de ownership

### Tokens de QR Code
- Gerado com `nanoid(32)` — não sequencial, não derivável
- Não expõe ID interno do ticket no QR
- Check-in valida token + status `ACTIVE` + `event.startsAt` dentro da janela de 30 minutos

### Pagamentos
- `idempotencyKey` único por tentativa de pagamento — previne cobrança dupla
- `SELECT FOR UPDATE` no `TicketTier.soldQty` — previne overselling em race condition
- M-Pesa usa polling (sem webhooks) — o cliente faz poll a `/api/payments/poll/[paymentId]` de 5 em 5 segundos
- Transação atómica: criar `Order` + decrementar `soldQty` + criar `Tickets` — tudo ou nada
- Repasse ao organizador: manual após evento — o dashboard mostra o valor líquido acumulado

### Inputs
- Validação server-side com Zod em todos os endpoints
- Tamanho máximo em campos de texto (title 120, description 2000, venue 200)
- `HTML_TAG_RE` para rejeitar HTML em campos de texto livres

### Headers de Segurança (next.config.mjs)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` restritivo

### Logs
- Nunca logar senha, token de QR, dados de cartão
- Logar: login, logout, falha de auth, check-in, pagamento, acesso negado

---

## Integrações Externas

| Serviço | Uso | Status |
|---|---|---|
| e2Payments (Explicador) | Gateway M-Pesa MZ | **Integrado e activo** |
| e-Mola | Pagamento mobile | Mock na v1 |
| Stripe | Cartão de crédito/débito | Integrado |
| Resend | Emails transacionais | Integrado (chave pendente) |
| Neon | PostgreSQL serverless | **Activo em produção** |
| Vercel | Hosting | **Deploy activo** |

---

## Modelo de Repasse ao Organizador (v1)

O dinheiro vai directo para a conta e2Payments da plataforma. O dashboard do organizador mostra:
- **Receita bruta**: total pago pelos compradores
- **Taxa plataforma** (7.5%): comissão da plataforma
- **A receber**: valor líquido transferido via M-Pesa após encerramento do evento

O repasse é feito manualmente pelo admin após o evento ser marcado como `FINISHED`.
