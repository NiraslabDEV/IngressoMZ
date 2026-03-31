import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as getOrder } from "@/app/api/orders/[id]/route";
import { NextRequest } from "next/server";

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.Mock;

const BUYER = { id: "buyer-1", role: "BUYER" };
const OTHER_BUYER = { id: "buyer-2", role: "BUYER" };

const PUBLISHED_EVENT = {
  id: "event-1",
  status: "PUBLISHED",
  startsAt: new Date(Date.now() + 86400000), // amanhã
};

const AVAILABLE_TIER = {
  id: "tier-1",
  eventId: "event-1",
  price: 500,
  totalQty: 100,
  soldQty: 50,
  salesEndAt: null,
};

function makeReq(body?: unknown, params?: { id: string }) {
  const url = params
    ? `http://localhost/api/orders/${params.id}`
    : "http://localhost/api/orders";
  return new NextRequest(url, {
    method: params ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── CRIAR PEDIDO ─────────────────────────────────────────────────────────────

describe("POST /api/orders", () => {
  describe("Happy path", () => {
    it("comprador autenticado cria pedido e retorna 201", async () => {
      mockGetServerSession.mockResolvedValue({ user: BUYER });
      mockDb.event.findUnique.mockResolvedValue(PUBLISHED_EVENT as any);
      mockDb.ticketTier.findMany.mockResolvedValue([AVAILABLE_TIER] as any);
      mockDb.$transaction.mockImplementation(async (fn: any) =>
        fn({
          ticketTier: {
            update: jest.fn().mockResolvedValue({ ...AVAILABLE_TIER, soldQty: 51 }),
            findMany: jest.fn().mockResolvedValue([AVAILABLE_TIER]),
          },
          order: { create: jest.fn().mockResolvedValue({ id: "order-1" }) },
          orderItem: { create: jest.fn() },
          ticket: { create: jest.fn().mockResolvedValue({ id: "ticket-1", token: "tok123" }) },
        })
      );

      const res = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: 1 }],
      }));

      expect(res.status).toBe(201);
    });
  });

  describe("Segurança — autenticação", () => {
    it("401 sem autenticação", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await createOrder(makeReq({ eventId: "event-1", items: [] }));
      expect(res.status).toBe(401);
    });
  });

  describe("Segurança — regras de negócio", () => {
    it("400 ao tentar comprar ingresso de evento cancelado", async () => {
      mockGetServerSession.mockResolvedValue({ user: BUYER });
      mockDb.event.findUnique.mockResolvedValue({ ...PUBLISHED_EVENT, status: "CANCELLED" } as any);

      const res = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: 1 }],
      }));
      expect(res.status).toBe(400);
    });

    it("400 ao tentar comprar ingresso de evento já encerrado", async () => {
      mockGetServerSession.mockResolvedValue({ user: BUYER });
      mockDb.event.findUnique.mockResolvedValue({
        ...PUBLISHED_EVENT,
        startsAt: new Date("2020-01-01"),
        status: "FINISHED",
      } as any);

      const res = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: 1 }],
      }));
      expect(res.status).toBe(400);
    });

    it("400 quando lote esgotado (soldQty === totalQty)", async () => {
      mockGetServerSession.mockResolvedValue({ user: BUYER });
      mockDb.event.findUnique.mockResolvedValue(PUBLISHED_EVENT as any);
      mockDb.ticketTier.findMany.mockResolvedValue([{
        ...AVAILABLE_TIER,
        soldQty: 100,
        totalQty: 100,
      }] as any);

      const res = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: 1 }],
      }));
      expect(res.status).toBe(400);
    });

    it("400 quando quantity solicitada excede stock disponível", async () => {
      mockGetServerSession.mockResolvedValue({ user: BUYER });
      mockDb.event.findUnique.mockResolvedValue(PUBLISHED_EVENT as any);
      mockDb.ticketTier.findMany.mockResolvedValue([{
        ...AVAILABLE_TIER,
        soldQty: 98,
        totalQty: 100,
      }] as any);

      const res = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: 5 }], // só 2 disponíveis
      }));
      expect(res.status).toBe(400);
    });

    it("400 com quantity zero ou negativa", async () => {
      mockGetServerSession.mockResolvedValue({ user: BUYER });

      const resZero = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: 0 }],
      }));
      expect(resZero.status).toBe(400);

      const resNeg = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: -1 }],
      }));
      expect(resNeg.status).toBe(400);
    });

    it("400 para tierId de outro evento (previne manipulação de ID)", async () => {
      mockGetServerSession.mockResolvedValue({ user: BUYER });
      mockDb.event.findUnique.mockResolvedValue(PUBLISHED_EVENT as any);
      mockDb.ticketTier.findMany.mockResolvedValue([{
        ...AVAILABLE_TIER,
        eventId: "event-OUTRO", // tier pertence a outro evento
      }] as any);

      const res = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: 1 }],
      }));
      expect(res.status).toBe(400);
    });
  });

  describe("Segurança — race condition (overselling)", () => {
    it("usa $transaction com SELECT FOR UPDATE para prevenir overselling", async () => {
      mockGetServerSession.mockResolvedValue({ user: BUYER });
      mockDb.event.findUnique.mockResolvedValue(PUBLISHED_EVENT as any);
      // Tier parece disponível fora da transaction...
      mockDb.ticketTier.findMany.mockResolvedValue([AVAILABLE_TIER] as any);

      // ...mas dentro da transaction outro request já esgotou o stock
      mockDb.$transaction.mockImplementation(async (fn: any) => {
        const txDb = {
          ticketTier: {
            findMany: jest.fn().mockResolvedValue([{
              ...AVAILABLE_TIER,
              soldQty: 100,
              totalQty: 100, // esgotou durante a transaction
            }]),
            update: jest.fn(),
          },
          order: { create: jest.fn() },
          ticket: { create: jest.fn() },
        };
        return fn(txDb);
      });

      const res = await createOrder(makeReq({
        eventId: "event-1",
        items: [{ tierId: "tier-1", quantity: 1 }],
      }));
      expect(res.status).toBe(400); // deve rejeitar, não criar ingresso em excesso
    });
  });
});

// ─── BUSCAR PEDIDO ─────────────────────────────────────────────────────────────

describe("GET /api/orders/[id]", () => {
  it("200 — comprador acessa seu próprio pedido", async () => {
    mockGetServerSession.mockResolvedValue({ user: BUYER });
    mockDb.order.findUnique.mockResolvedValue({
      id: "order-1",
      buyerId: "buyer-1", // dono
      tickets: [],
    } as any);

    const res = await getOrder(makeReq(undefined, { id: "order-1" }), { params: { id: "order-1" } });
    expect(res.status).toBe(200);
  });

  it("401 sem autenticação", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await getOrder(makeReq(undefined, { id: "order-1" }), { params: { id: "order-1" } });
    expect(res.status).toBe(401);
  });

  it("403 IDOR — comprador tentando ver pedido de outro comprador", async () => {
    mockGetServerSession.mockResolvedValue({ user: OTHER_BUYER }); // buyer-2
    mockDb.order.findUnique.mockResolvedValue({
      id: "order-1",
      buyerId: "buyer-1", // dono é buyer-1
    } as any);

    const res = await getOrder(makeReq(undefined, { id: "order-1" }), { params: { id: "order-1" } });
    expect(res.status).toBe(403);
  });
});
