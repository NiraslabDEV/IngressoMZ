import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMpesaPayments } from "@/lib/payments/e2payments";

type RouteParams = { params: { paymentId: string } };

// e2Payments não tem webhooks — o frontend chama este endpoint até status != PENDING
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const payment = await db.payment.findUnique({
    where: { id: params.paymentId },
    include: { order: { select: { buyerId: true } } },
  });

  if (!payment) {
    return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
  }

  // Ownership — comprador só consulta os seus pagamentos
  if (payment.order.buyerId !== session!.user!.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  // Já confirmado ou falhado — devolve directo sem consultar e2Payments
  if (payment.status !== "PENDING") {
    return NextResponse.json({ status: payment.status });
  }

  // Ainda PENDING — consulta e2Payments para ver se o utilizador já aprovou
  try {
    const payments = await getMpesaPayments();
    const confirmed = payments.find(
      (p) => p.reference === payment.idempotencyKey && p.status === "COMPLETED"
    );

    if (confirmed) {
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

      return NextResponse.json({ status: "COMPLETED" });
    }
  } catch {
    // Se e2Payments falhar, devolve estado actual da DB sem erro 500
  }

  return NextResponse.json({ status: "PENDING" });
}
