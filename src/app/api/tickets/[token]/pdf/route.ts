import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { TicketPdfDocument } from "@/lib/pdf";

type RouteParams = { params: { token: string } };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const ticket = await db.ticket.findUnique({
    where: { token: params.token },
    include: {
      tier: { select: { name: true } },
      order: {
        include: {
          buyer: { select: { name: true, email: true } },
          event: { select: { title: true, venue: true, startsAt: true } },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ingresso não encontrado." }, { status: 404 });
  }

  // Só o comprador pode descarregar
  if (ticket.order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const { order } = ticket;
  const doc = await TicketPdfDocument({
    eventName: order.event.title,
    venue: order.event.venue,
    startsAt: new Date(order.event.startsAt).toLocaleDateString("pt-MZ", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    tierName: ticket.tier.name,
    buyerName: order.buyer.name ?? "—",
    buyerEmail: order.buyer.email,
    token: ticket.token,
    orderId: order.id,
    ticketId: ticket.id,
  });

  const buffer = await renderToBuffer(doc);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ingresso-${ticket.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
