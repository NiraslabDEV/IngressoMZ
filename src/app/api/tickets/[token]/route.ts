import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/api";

type RouteParams = { params: { token: string } };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const authError = requireRole(session, "ORGANIZER");
  if (authError) return authError;

  const ticket = await db.ticket.findUnique({
    where: { token: params.token },
    include: {
      order: {
        include: {
          event: { select: { id: true, organizerId: true, title: true, startsAt: true, endsAt: true, status: true } },
        },
      },
      tier: { select: { name: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ingresso não encontrado." }, { status: 404 });
  }

  // Ownership: organizador só consulta ingressos dos seus eventos
  if (ticket.order.event.organizerId !== session!.user!.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  return NextResponse.json(ticket);
}
