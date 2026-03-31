import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

// Lazy init — evita erro de apiKey vazia no import em testes
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const idempotencyKey = intent.metadata?.idempotencyKey;
    if (!idempotencyKey) return NextResponse.json({ ok: true });

    const payment = await db.payment.findUnique({ where: { idempotencyKey } });
    if (!payment || payment.status === "COMPLETED") {
      return NextResponse.json({ ok: true });
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", providerRef: intent.id },
    });

    await db.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" },
    });

    await db.ticket.updateMany({
      where: { orderId: payment.orderId },
      data: { status: "ACTIVE" },
    });
  }

  return NextResponse.json({ ok: true });
}
