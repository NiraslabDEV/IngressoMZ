import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

function verifyHmac(body: string, signature: string): boolean {
  const secret = process.env.MPESA_API_KEY;
  if (!secret) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

  // timingSafeEqual previne timing attacks
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-mpesa-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 401 });
  }

  const body = await req.text();

  if (!verifyHmac(body, signature)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: { providerRef?: string; status?: string };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { providerRef, status } = payload;
  if (!providerRef || status !== "COMPLETED") {
    return NextResponse.json({ ok: true });
  }

  const payment = await db.payment.findFirst({ where: { providerRef } });
  if (!payment) {
    return NextResponse.json({ ok: true }); // ignora refs desconhecidas
  }

  // Idempotência — não re-processa pagamento já confirmado
  if (payment.status === "COMPLETED") {
    return NextResponse.json({ ok: true });
  }

  await db.payment.update({
    where: { id: payment.id },
    data: { status: "COMPLETED" },
  });

  await db.order.update({
    where: { id: payment.orderId },
    data: { status: "PAID" },
  });

  await db.ticket.updateMany({
    where: { orderId: payment.orderId },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ ok: true });
}
