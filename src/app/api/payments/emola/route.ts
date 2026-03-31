import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { initiateEmolaPayment } from "@/lib/payments/emola";

const MZ_PHONE_RE = /^8[2-7]\d{7}$/;

const emolaSchema = z.object({
  orderId: z.string().min(1),
  phone: z.string().regex(MZ_PHONE_RE, "Número de telemóvel inválido."),
  idempotencyKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const parsed = emolaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { orderId, phone, idempotencyKey } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (order.buyerId !== session!.user!.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Pedido não está pendente." }, { status: 400 });
  }

  const existing = await db.payment.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return NextResponse.json({ error: "Chave de idempotência já utilizada." }, { status: 409 });
  }

  const result = await initiateEmolaPayment({
    phone,
    amount: Number(order.totalAmount),
    reference: idempotencyKey,
  });

  const payment = await db.payment.create({
    data: {
      orderId,
      provider: "EMOLA",
      providerRef: result.providerRef ?? null,
      idempotencyKey,
      amount: order.totalAmount,
      status: result.success ? "PENDING" : "FAILED",
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
