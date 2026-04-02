import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTicketPdf } from "@/lib/pdf";

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

  if (ticket.order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const { order } = ticket;
  const buffer = await generateTicketPdf({
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

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ingresso-${ticket.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
