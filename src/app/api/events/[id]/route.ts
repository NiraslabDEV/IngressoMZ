import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole, HTML_TAG_RE, type AuthedSession } from "@/lib/api";

const updateEventSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(120)
    .refine((v) => !HTML_TAG_RE.test(v), { message: "Título inválido." })
    .optional(),
  description: z
    .string()
    .min(1)
    .max(2000)
    .refine((v) => !HTML_TAG_RE.test(v), { message: "Descrição inválida." })
    .optional(),
  venue: z
    .string()
    .min(1)
    .max(200)
    .refine((v) => !HTML_TAG_RE.test(v), { message: "Local inválido." })
    .optional(),
  startsAt: z
    .string()
    .datetime()
    .refine((v) => new Date(v) > new Date(), { message: "Data deve ser no futuro." })
    .optional(),
  endsAt: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "FINISHED"]).optional(),
});

type RouteParams = { params: { id: string } };

// ─── GET /api/events/[id] ─────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await auth() as AuthedSession | null;
  const role = (session?.user as { role?: string } | undefined)?.role;

  const event = await db.event.findUnique({
    where: { id: params.id },
    include: { tiers: true, highlights: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  // Rascunhos só visíveis para o próprio organizador
  if (event.status === "DRAFT") {
    if (role !== "ORGANIZER" || event.organizerId !== session!.user.id) {
      return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    }
  }

  return NextResponse.json(event);
}

// ─── PUT /api/events/[id] ─────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await auth() as AuthedSession | null;
  const authError = requireRole(session, "ORGANIZER");
  if (authError) return authError;

  const event = await db.event.findUnique({ where: { id: params.id } });
  if (!event) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  // Ownership check — organizador só edita os seus eventos
  if (event.organizerId !== session!.user.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const updated = await db.event.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/events/[id] ──────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth() as AuthedSession | null;
  const authError = requireRole(session, "ORGANIZER");
  if (authError) return authError;

  const event = await db.event.findUnique({
    where: { id: params.id },
    include: { tiers: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  // Ownership check
  if (event.organizerId !== session!.user.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  // Não permite deletar evento com ingressos vendidos
  const hasSoldTickets = (event.tiers as { soldQty: number }[]).some((t) => t.soldQty > 0);
  if (hasSoldTickets) {
    return NextResponse.json(
      { error: "Não é possível deletar um evento com ingressos vendidos." },
      { status: 400 }
    );
  }

  await db.event.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
