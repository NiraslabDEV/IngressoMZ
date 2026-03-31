import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { POST as initiateMpesa } from "@/app/api/payments/mpesa/route";
import { POST as initiateEmola } from "@/app/api/payments/emola/route";
import { GET as pollPayment } from "@/app/api/payments/poll/[paymentId]/route";
import { POST as stripeWebhook } from "@/app/api/payments/webhooks/stripe/route";
import { NextRequest } from "next/server";
import * as e2payments from "@/lib/payments/e2payments";

jest.mock("@/lib/payments/e2payments", () => ({
  initiateMpesaPayment: jest.fn(),
  getMpesaPayments: jest.fn(),
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockAuth = auth as jest.Mock;
const mockE2P = e2payments as jest.Mocked<typeof e2payments>;

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

function makePollReq(paymentId: string) {
  return new NextRequest(`http://localhost/api/payments/poll/${paymentId}`, {
    method: "GET",
  });
}

// ─── INICIAR PAGAMENTO ────────────────────────────────────────────────────────

describe("POST /api/payments/mpesa", () => {
  describe("Happy path", () => {
    it("201 — cria payment com idempotencyKey único", async () => {
      mockAuth.mockResolvedValue({ user: BUYER });
      mockDb.order.findUnique.mockResolvedValue(PENDING_ORDER as any);
      mockDb.payment.findUnique.mockResolvedValue(null);
      mockE2P.initiateMpesaPayment.mockResolvedValue({ success: true, providerRef: "E2P-REF-123" });
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
        buyerId: "buyer-1",
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
      mockDb.payment.findUnique.mockResolvedValue({ id: "pay-existente" } as any);

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
        phone: "123",
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

// ─── POLLING DE PAGAMENTO ─────────────────────────────────────────────────────

describe("GET /api/payments/poll/[paymentId]", () => {
  const PENDING_PAYMENT = {
    id: "pay-1",
    orderId: "order-1",
    idempotencyKey: "idem-key-123",
    status: "PENDING",
    order: { buyerId: "buyer-1" },
  };

  it("200 PENDING — e2Payments ainda não confirmou", async () => {
    mockAuth.mockResolvedValue({ user: BUYER });
    mockDb.payment.findUnique.mockResolvedValue(PENDING_PAYMENT as any);
    mockE2P.getMpesaPayments.mockResolvedValue([]);

    const res = await pollPayment(makePollReq("pay-1"), { params: { paymentId: "pay-1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PENDING");
  });

  it("200 COMPLETED — e2Payments confirmou, actualiza DB", async () => {
    mockAuth.mockResolvedValue({ user: BUYER });
    mockDb.payment.findUnique.mockResolvedValue(PENDING_PAYMENT as any);
    mockE2P.getMpesaPayments.mockResolvedValue([
      { reference: "idem-key-123", status: "COMPLETED" },
    ]);
    mockDb.payment.update.mockResolvedValue({} as any);
    mockDb.order.update.mockResolvedValue({} as any);
    mockDb.ticket.updateMany.mockResolvedValue({ count: 1 } as any);

    const res = await pollPayment(makePollReq("pay-1"), { params: { paymentId: "pay-1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("COMPLETED");
    expect(mockDb.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PAID" } })
    );
  });

  it("200 COMPLETED directo — já confirmado na DB, não chama e2Payments", async () => {
    mockAuth.mockResolvedValue({ user: BUYER });
    mockDb.payment.findUnique.mockResolvedValue({
      ...PENDING_PAYMENT,
      status: "COMPLETED",
    } as any);

    const res = await pollPayment(makePollReq("pay-1"), { params: { paymentId: "pay-1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("COMPLETED");
    expect(mockE2P.getMpesaPayments).not.toHaveBeenCalled();
  });

  it("401 sem autenticação", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await pollPayment(makePollReq("pay-1"), { params: { paymentId: "pay-1" } });
    expect(res.status).toBe(401);
  });

  it("403 IDOR — comprador consultando pagamento de outro", async () => {
    mockAuth.mockResolvedValue({ user: { id: "buyer-99", role: "BUYER" } });
    mockDb.payment.findUnique.mockResolvedValue(PENDING_PAYMENT as any);

    const res = await pollPayment(makePollReq("pay-1"), { params: { paymentId: "pay-1" } });
    expect(res.status).toBe(403);
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
