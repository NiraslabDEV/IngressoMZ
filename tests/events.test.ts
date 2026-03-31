import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  GET as listEvents,
  POST as createEvent,
} from "@/app/api/events/route";
import {
  GET as getEvent,
  PUT as updateEvent,
  DELETE as deleteEvent,
} from "@/app/api/events/[id]/route";
import { NextRequest } from "next/server";

const mockDb = db as jest.Mocked<typeof db>;
const mockAuth = auth as jest.Mock;

const ORGANIZER = { id: "org-1", role: "ORGANIZER", name: "Org" };
const OTHER_ORGANIZER = { id: "org-2", role: "ORGANIZER", name: "Outro" };
const BUYER = { id: "buyer-1", role: "BUYER", name: "Comprador" };

function makeReq(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params?.id
    ? `http://localhost/api/events/${params.id}`
    : "http://localhost/api/events";
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const validEventBody = {
  title: "Concerto de Jazz",
  description: "Uma noite incrível de jazz no coração de Maputo.",
  venue: "Teatro Avenida, Maputo",
  startsAt: futureDate,
  tiers: [
    { name: "Normal", price: 500, totalQty: 200 },
    { name: "VIP", price: 1500, totalQty: 50 },
  ],
};

// ─── LISTAR EVENTOS ───────────────────────────────────────────────────────────

describe("GET /api/events", () => {
  it("retorna lista pública de eventos publicados sem autenticação", async () => {
    mockAuth.mockResolvedValue(null);
    mockDb.event.findMany.mockResolvedValue([]);

    const res = await listEvents(makeReq("GET"));
    expect(res.status).toBe(200);
  });
});

// ─── CRIAR EVENTO ─────────────────────────────────────────────────────────────

describe("POST /api/events", () => {
  describe("Happy path", () => {
    it("organizer autenticado cria evento e retorna 201", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      mockDb.event.create.mockResolvedValue({ id: "event-1", ...validEventBody } as any);

      const res = await createEvent(makeReq("POST", validEventBody));
      expect(res.status).toBe(201);
    });
  });

  describe("Segurança — autenticação e autorização", () => {
    it("401 sem autenticação", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await createEvent(makeReq("POST", validEventBody));
      expect(res.status).toBe(401);
    });

    it("403 quando role é BUYER (não organizador)", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      const res = await createEvent(makeReq("POST", validEventBody));
      expect(res.status).toBe(403);
    });
  });

  describe("Segurança — inputs", () => {
    it("400 com XSS no título: <script>alert(1)</script>", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      const res = await createEvent(makeReq("POST", {
        ...validEventBody,
        title: "<script>alert(1)</script>",
      }));
      expect(res.status).toBe(400);
    });

    it("400 com título acima de 120 caracteres", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      const res = await createEvent(makeReq("POST", {
        ...validEventBody,
        title: "A".repeat(121),
      }));
      expect(res.status).toBe(400);
    });

    it("400 com descrição acima de 2000 caracteres", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      const res = await createEvent(makeReq("POST", {
        ...validEventBody,
        description: "A".repeat(2001),
      }));
      expect(res.status).toBe(400);
    });

    it("400 com descrição XSS: <img src=x onerror=alert(1)>", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      const res = await createEvent(makeReq("POST", {
        ...validEventBody,
        description: '<img src=x onerror=alert(1)>',
      }));
      expect(res.status).toBe(400);
    });

    it("400 com preço de ingresso negativo", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      const res = await createEvent(makeReq("POST", {
        ...validEventBody,
        tiers: [{ name: "Normal", price: -100, totalQty: 100 }],
      }));
      expect(res.status).toBe(400);
    });

    it("400 com data no passado", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      const res = await createEvent(makeReq("POST", {
        ...validEventBody,
        startsAt: "2020-01-01T00:00:00Z",
      }));
      expect(res.status).toBe(400);
    });
  });
});

// ─── EDITAR EVENTO ────────────────────────────────────────────────────────────

describe("PUT /api/events/[id]", () => {
  const params = { params: { id: "event-1" } };

  describe("Happy path", () => {
    it("organizador dono do evento consegue editar", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      mockDb.event.findUnique.mockResolvedValue({ id: "event-1", organizerId: "org-1" } as any);
      mockDb.event.update.mockResolvedValue({ id: "event-1" } as any);

      const res = await updateEvent(makeReq("PUT", { title: "Novo título" }), params);
      expect(res.status).toBe(200);
    });
  });

  describe("Segurança", () => {
    it("401 sem autenticação", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await updateEvent(makeReq("PUT", { title: "X" }), params);
      expect(res.status).toBe(401);
    });

    it("403 IDOR — organizador tentando editar evento de outro organizador", async () => {
      mockAuth.mockResolvedValue({ user: OTHER_ORGANIZER }); // org-2
      mockDb.event.findUnique.mockResolvedValue({ id: "event-1", organizerId: "org-1" } as any); // dono é org-1

      const res = await updateEvent(makeReq("PUT", { title: "Hack" }), params);
      expect(res.status).toBe(403);
    });

    it("403 — BUYER tentando editar qualquer evento", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      const res = await updateEvent(makeReq("PUT", { title: "Hack" }), params);
      expect(res.status).toBe(403);
    });

    it("404 para evento inexistente (não expõe 403 vs 404 para não vazar existência)", async () => {
      mockAuth.mockResolvedValue({ user: ORGANIZER });
      mockDb.event.findUnique.mockResolvedValue(null);

      const res = await updateEvent(makeReq("PUT", { title: "X" }), params);
      expect([403, 404]).toContain(res.status);
    });
  });
});

// ─── DELETAR EVENTO ───────────────────────────────────────────────────────────

describe("DELETE /api/events/[id]", () => {
  const params = { params: { id: "event-1" } };

  it("401 sem autenticação", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await deleteEvent(makeReq("DELETE"), params);
    expect(res.status).toBe(401);
  });

  it("403 IDOR — deletar evento alheio", async () => {
    mockAuth.mockResolvedValue({ user: OTHER_ORGANIZER });
    mockDb.event.findUnique.mockResolvedValue({ id: "event-1", organizerId: "org-1" } as any);

    const res = await deleteEvent(makeReq("DELETE"), params);
    expect(res.status).toBe(403);
  });

  it("400 — não permite deletar evento com ingressos vendidos", async () => {
    mockAuth.mockResolvedValue({ user: ORGANIZER });
    mockDb.event.findUnique.mockResolvedValue({
      id: "event-1",
      organizerId: "org-1",
      tiers: [{ soldQty: 10 }],
    } as any);

    const res = await deleteEvent(makeReq("DELETE"), params);
    expect(res.status).toBe(400);
  });
});
