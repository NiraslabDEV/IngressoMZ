import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GET as getTicket } from "@/app/api/tickets/[token]/route";
import { POST as checkIn } from "@/app/api/tickets/[token]/checkin/route";
import { NextRequest } from "next/server";

const mockDb = db as jest.Mocked<typeof db>;
const mockAuth = auth as jest.Mock;

const ORGANIZER = { id: "org-1", role: "ORGANIZER" };
const OTHER_ORGANIZER = { id: "org-2", role: "ORGANIZER" };
const BUYER = { id: "buyer-1", role: "BUYER" };

const ACTIVE_TICKET = {
  id: "ticket-1",
  token: "valid-token-abc123",
  status: "ACTIVE",
  checkedInAt: null,
  order: {
    buyerId: "buyer-1",
    event: {
      id: "event-1",
      organizerId: "org-1",
      startsAt: new Date(Date.now() - 3600000), // 1h atrás (evento já começou)
      endsAt: new Date(Date.now() + 3600000),   // termina em 1h
      status: "PUBLISHED",
    },
  },
};

function makeReq(method: string, token: string) {
  const url = method === "POST"
    ? `http://localhost/api/tickets/${token}/checkin`
    : `http://localhost/api/tickets/${token}`;
  return new NextRequest(url, { method });
}

// ─── BUSCAR INGRESSO (QR SCAN) ────────────────────────────────────────────────

describe("GET /api/tickets/[token]", () => {
  it("200 — organizador do evento consulta ingresso válido", async () => {
    mockAuth.mockResolvedValue({ user: ORGANIZER });
    mockDb.ticket.findUnique.mockResolvedValue(ACTIVE_TICKET as any);

    const res = await getTicket(makeReq("GET", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
    expect(res.status).toBe(200);
  });

  it("401 sem autenticação", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await getTicket(makeReq("GET", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
    expect(res.status).toBe(401);
  });

  it("403 — organizador de outro evento tentando consultar ingresso alheio", async () => {
    mockAuth.mockResolvedValue({ user: OTHER_ORGANIZER }); // org-2
    mockDb.ticket.findUnique.mockResolvedValue(ACTIVE_TICKET as any); // evento pertence ao org-1

    const res = await getTicket(makeReq("GET", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
    expect(res.status).toBe(403);
  });

  it("404 para token inexistente", async () => {
    mockAuth.mockResolvedValue({ user: ORGANIZER });
    mockDb.ticket.findUnique.mockResolvedValue(null);

    const res = await getTicket(makeReq("GET", "token-que-nao-existe"), { params: { token: "token-que-nao-existe" } });
    expect(res.status).toBe(404);
  });

  it("comprador NÃO pode consultar ingresso via endpoint de check-in", async () => {
    mockAuth.mockResolvedValue({ user: BUYER });
    const res = await getTicket(makeReq("GET", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
    expect(res.status).toBe(403);
  });
});

// ─── CHECK-IN (VALIDAÇÃO NA ENTRADA) ─────────────────────────────────────────

describe("POST /api/tickets/[token]/checkin", () => {
  describe("Happy path", () => {
    it("200 — organizador valida ingresso ativo", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      mockDb.ticket.findUnique.mockResolvedValue(ACTIVE_TICKET as any);
      mockDb.ticket.update.mockResolvedValue({
        ...ACTIVE_TICKET,
        status: "USED",
        checkedInAt: new Date(),
      } as any);
      // $transaction passa mockDb como tx — ticket.findUnique e ticket.update já estão mockados
      mockDb.$transaction.mockImplementation(async (fn: any) => fn(mockDb));

      const res = await checkIn(makeReq("POST", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
      expect(res.status).toBe(200);
    });
  });

  describe("Segurança — autenticação e autorização", () => {
    it("401 sem autenticação", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await checkIn(makeReq("POST", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
      expect(res.status).toBe(401);
    });

    it("403 — BUYER tentando fazer check-in", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      const res = await checkIn(makeReq("POST", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
      expect(res.status).toBe(403);
    });

    it("403 IDOR — organizador de outro evento tentando validar ingresso alheio", async () => {
      mockAuth.mockResolvedValue({ user: OTHER_ORGANIZER }); // org-2
      mockDb.ticket.findUnique.mockResolvedValue(ACTIVE_TICKET as any); // evento é do org-1

      const res = await checkIn(makeReq("POST", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
      expect(res.status).toBe(403);
    });
  });

  describe("Segurança — regras de negócio", () => {
    it("409 — ingresso já utilizado (previne entrada dupla)", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      mockDb.ticket.findUnique.mockResolvedValue({
        ...ACTIVE_TICKET,
        status: "USED",
        checkedInAt: new Date(),
      } as any);

      const res = await checkIn(makeReq("POST", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
      expect(res.status).toBe(409);
    });

    it("400 — ingresso cancelado não pode ser validado", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      mockDb.ticket.findUnique.mockResolvedValue({
        ...ACTIVE_TICKET,
        status: "CANCELLED",
      } as any);

      const res = await checkIn(makeReq("POST", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
      expect(res.status).toBe(400);
    });

    it("400 — evento ainda não começou (check-in prematuro)", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      mockDb.ticket.findUnique.mockResolvedValue({
        ...ACTIVE_TICKET,
        order: {
          ...ACTIVE_TICKET.order,
          event: {
            ...ACTIVE_TICKET.order.event,
            startsAt: new Date(Date.now() + 7200000), // começa em 2h
          },
        },
      } as any);

      const res = await checkIn(makeReq("POST", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
      expect(res.status).toBe(400);
    });

    it("404 para token inexistente (não vaza informação)", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      mockDb.ticket.findUnique.mockResolvedValue(null);

      const res = await checkIn(makeReq("POST", "token-inventado"), { params: { token: "token-inventado" } });
      expect(res.status).toBe(404);
    });
  });

  describe("Segurança — race condition (dupla entrada simultânea)", () => {
    it("usa $transaction para garantir atomicidade no check-in", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      // Ticket aparece ACTIVE fora da transaction...
      mockDb.ticket.findUnique.mockResolvedValue(ACTIVE_TICKET as any);

      // ...mas dentro da transaction outro request já o marcou como USED
      mockDb.$transaction.mockImplementation(async (fn: any) => {
        const txDb = {
          ticket: {
            findUnique: jest.fn().mockResolvedValue({
              ...ACTIVE_TICKET,
              status: "USED", // outro request ganhou a corrida
            }),
            update: jest.fn(),
          },
        };
        return fn(txDb);
      });

      const res = await checkIn(makeReq("POST", "valid-token-abc123"), { params: { token: "valid-token-abc123" } });
      expect(res.status).toBe(409); // deve rejeitar, não validar duas vezes
    });
  });
});
