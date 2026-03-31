import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole, HTML_TAG_RE, type AuthedSession } from "@/lib/api";

const tierSchema = z.object({
  name: z.string().min(1).max(80),
  price: z.number().positive("Preço deve ser positivo."),
  totalQty: z.number().int().positive("Quantidade deve ser positiva."),
  salesEndAt: z.string().datetime().optional(),
});

const createEventSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(120, "Título não pode ter mais de 120 caracteres.")
    .refine((v) => !HTML_TAG_RE.test(v), { message: "Título inválido." }),
  description: z
    .string()
    .min(1)
    .max(2000, "Descrição não pode ter mais de 2000 caracteres.")
    .refine((v) => !HTML_TAG_RE.test(v), { message: "Descrição inválida." }),
  venue: z
    .string()
    .min(1)
    .max(200)
    .refine((v) => !HTML_TAG_RE.test(v), { message: "Local inválido." }),
  startsAt: z
    .string()
    .datetime()
    .refine((v) => new Date(v) > new Date(), { message: "Data deve ser no futuro." }),
  endsAt: z.string().datetime().optional(),
  tiers: z.array(tierSchema).min(1, "Pelo menos um lote de ingressos é obrigatório."),
});

// ─── GET /api/events — lista pública ─────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    include: {
      tiers: { select: { name: true, price: true, totalQty: true, soldQty: true } },
      highlights: { where: { endsAt: { gte: new Date() } }, select: { position: true } },
    },
  });

  return NextResponse.json(events);
}

// ─── POST /api/events — criar evento ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authError = requireRole(session, "ORGANIZER");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { tiers, ...eventData } = parsed.data;

  const event = await db.event.create({
    data: {
      ...eventData,
      organizerId: session!.user.id,
      tiers: { create: tiers },
    },
    include: { tiers: true },
  });

  return NextResponse.json(event, { status: 201 });
}
