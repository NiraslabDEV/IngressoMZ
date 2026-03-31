import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { POST as initiateMpesa } from "@/app/api/payments/mpesa/route";
import { POST as initiateEmola } from "@/app/api/payments/emola/route";
import { POST as mpesaWebhook } from "@/app/api/payments/webhooks/mpesa/route";
import { POST as stripeWebhook } from "@/app/api/payments/webhooks/stripe/route";
import { NextRequest } from "next/server";
import crypto from "crypto";

const mockDb = db as jest.Mocked<typeof db>;
const mockAuth = auth as jest.Mock;

const BUYER = { id: "buyer-1", role: "BUYER" };

const PENDING_ORDER = {
  id: "order-1",
  buyerId: "buyer-1",
  status: "PENDING",
  totalAmount: 500,
};

function makePaymentReq(body: unknown) {
  return new NextRequest("http://localhost/api/payments/mpesa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── INICIAR PAGAMENTO ────────────────────────────────────────────────────────

describe("POST /api/payments/mpesa", () => {
  describe("Happy path", () => {
    it("201 — cria payment com idempotencyKey único", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      mockDb.order.findUnique.mockResolvedValue(PENDING_ORDER as any);
      mockDb.payment.findUnique.mockResolvedValue(null); // key não usada
      mockDb.payment.create.mockResolvedValue({ id: "pay-1" } as any);

      const res = await initiateMpesa(makePaymentReq({
        orderId: "order-1",
        phone: "841234567",
        idempotencyKey: "idem-key-unique-123",
      }));

      expect(res.status).toBe(201);
    });
  });

  describe("Segurança — autenticação", () => {
    it("401 sem autenticação", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await initiateMpesa(makePaymentReq({ orderId: "order-1" }));
      expect(res.status).toBe(401);
    });
  });

  describe("Segurança — autorização (IDOR)", () => {
    it("403 ao tentar pagar pedido de outro comprador", async () => {
      mockAuth.mockResolvedValue({ user: { id: "buyer-99", role: "BUYER" } });
      mockDb.order.findUnique.mockResolvedValue({
        ...PENDING_ORDER,
        buyerId: "buyer-1", // dono é buyer-1, não buyer-99
      } as any);

      const res = await initiateMpesa(makePaymentReq({
        orderId: "order-1",
        phone: "841234567",
        idempotencyKey: "idem-key-123",
      }));
      expect(res.status).toBe(403);
    });
  });

  describe("Segurança — idempotência", () => {
    it("409 ao reutilizar idempotencyKey já processada", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      mockDb.order.findUnique.mockResolvedValue(PENDING_ORDER as any);
      mockDb.payment.findUnique.mockResolvedValue({ id: "pay-existente" } as any); // key já existe

      const res = await initiateMpesa(makePaymentReq({
        orderId: "order-1",
        phone: "841234567",
        idempotencyKey: "idem-key-ja-usada",
      }));
      expect(res.status).toBe(409);
    });

    it("400 sem idempotencyKey no body", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      const res = await initiateMpesa(makePaymentReq({
        orderId: "order-1",
        phone: "841234567",
        // sem idempotencyKey
      }));
      expect(res.status).toBe(400);
    });
  });

  describe("Segurança — regras de negócio", () => {
    it("400 ao tentar pagar pedido já pago", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      mockDb.order.findUnique.mockResolvedValue({ ...PENDING_ORDER, status: "PAID" } as any);

      const res = await initiateMpesa(makePaymentReq({
        orderId: "order-1",
        phone: "841234567",
        idempotencyKey: "idem-key-novo",
      }));
      expect(res.status).toBe(400);
    });

    it("400 com número de telemóvel inválido para M-Pesa", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      mockDb.order.findUnique.mockResolvedValue(PENDING_ORDER as any);

      const res = await initiateMpesa(makePaymentReq({
        orderId: "order-1",
        phone: "123", // inválido
        idempotencyKey: "idem-key-novo",
      }));
      expect(res.status).toBe(400);
    });

    it("400 com phone contendo script injection", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      const res = await initiateMpesa(makePaymentReq({
        orderId: "order-1",
        phone: "<script>alert(1)</script>",
        idempotencyKey: "idem-key-novo",
      }));
      expect(res.status).toBe(400);
    });
  });
});

// ─── WEBHOOK M-PESA ───────────────────────────────────────────────────────────

describe("POST /api/payments/webhooks/mpesa", () => {
  it("400 sem assinatura HMAC no header", async () => {
    const req = new NextRequest("http://localhost/api/payments/webhooks/mpesa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // sem x-mpesa-signature
      body: JSON.stringify({ orderId: "order-1", status: "COMPLETED" }),
    });

    const res = await mpesaWebhook(req);
    expect(res.status).toBe(401);
  });

  it("401 com assinatura inválida (webhook forjado)", async () => {
    const body = JSON.stringify({ orderId: "order-1", status: "COMPLETED" });
    const fakeSignature = "sha256=invalido";

    const req = new NextRequest("http://localhost/api/payments/webhooks/mpesa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mpesa-signature": fakeSignature,
      },
      body,
    });

    const res = await mpesaWebhook(req);
    expect(res.status).toBe(401);
  });

  it("200 com assinatura HMAC válida e processa pagamento", async () => {
    const secret = process.env.MPESA_API_KEY || "test-secret";
    const body = JSON.stringify({ providerRef: "MPESA-REF-123", status: "COMPLETED" });
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");

    mockDb.payment.findFirst.mockResolvedValue({ id: "pay-1", orderId: "order-1", status: "PENDING" } as any);
    mockDb.payment.update.mockResolvedValue({ id: "pay-1", status: "COMPLETED" } as any);
    mockDb.order.update.mockResolvedValue({ id: "order-1", status: "PAID" } as any);
    mockDb.ticket.updateMany.mockResolvedValue({ count: 2 } as any);

    const req = new NextRequest("http://localhost/api/payments/webhooks/mpesa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mpesa-signature": `sha256=${sig}`,
      },
      body,
    });

    const res = await mpesaWebhook(req);
    expect(res.status).toBe(200);
  });

  it("idempotente — ignora webhook duplicado para payment já COMPLETED", async () => {
    const secret = process.env.MPESA_API_KEY || "test-secret";
    const body = JSON.stringify({ providerRef: "MPESA-REF-123", status: "COMPLETED" });
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");

    // Simula payment já processado
    mockDb.payment.findFirst.mockResolvedValue({ id: "pay-1", status: "COMPLETED" } as any);

    const req = new NextRequest("http://localhost/api/payments/webhooks/mpesa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mpesa-signature": `sha256=${sig}`,
      },
      body,
    });

    const res = await mpesaWebhook(req);
    expect(res.status).toBe(200); // retorna 200 mas não re-processa
    expect(mockDb.order.update).not.toHaveBeenCalled();
  });
});

// ─── WEBHOOK STRIPE ───────────────────────────────────────────────────────────

describe("POST /api/payments/webhooks/stripe", () => {
  it("400 sem stripe-signature header", async () => {
    const req = new NextRequest("http://localhost/api/payments/webhooks/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "payment_intent.succeeded" }),
    });
    const res = await stripeWebhook(req);
    expect(res.status).toBe(400);
  });
});
