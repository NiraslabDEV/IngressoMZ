import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole, type AuthedSession } from "@/lib/api";

type RouteParams = { params: { token: string } };

const CHECKIN_WINDOW_MINUTES_BEFORE = 30;

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await auth() as AuthedSession | null;
  const authError = requireRole(session, "ORGANIZER");
  if (authError) return authError;

  // Leitura inicial fora da transaction para ownership e validações rápidas
  const ticket = await db.ticket.findUnique({
    where: { token: params.token },
    include: {
      order: {
        include: {
          event: { select: { organizerId: true, startsAt: true, endsAt: true, status: true } },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ingresso não encontrado." }, { status: 404 });
  }

  // Ownership check
  if (ticket.order.event.organizerId !== session!.user.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  // Ingresso cancelado não pode ser validado
  if (ticket.status === "CANCELLED") {
    return NextResponse.json({ error: "Ingresso cancelado." }, { status: 400 });
  }

  // Ingresso já utilizado (fast-fail)
  if (ticket.status === "USED") {
    return NextResponse.json({ error: "Ingresso já utilizado." }, { status: 409 });
  }

  // Janela de check-in: evento deve ter começado (ou estar a 30min de começar)
  const now = new Date();
  const windowStart = new Date(ticket.order.event.startsAt);
  windowStart.setMinutes(windowStart.getMinutes() - CHECKIN_WINDOW_MINUTES_BEFORE);

  if (now < windowStart) {
    return NextResponse.json(
      { error: "Evento ainda não começou. Check-in disponível 30 minutos antes." },
      { status: 400 }
    );
  }

  // Transaction atómica — re-verifica status para proteger contra race condition
  try {
    const updated = await db.$transaction(async (tx) => {
      const fresh = await tx.ticket.findUnique({ where: { token: params.token } });

      if (!fresh || fresh.status === "USED") {
        throw new Error("ALREADY_USED");
      }
      if (fresh.status === "CANCELLED") {
        throw new Error("CANCELLED");
      }

      return tx.ticket.update({
        where: { token: params.token },
        data: {
          status: "USED",
          checkedInAt: new Date(),
          checkedInBy: session!.user.id,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ALREADY_USED") {
      return NextResponse.json({ error: "Ingresso já utilizado." }, { status: 409 });
    }
    if (err instanceof Error && err.message === "CANCELLED") {
      return NextResponse.json({ error: "Ingresso cancelado." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
