import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

const createOrderSchema = z.object({
  eventId: z.string().min(1),
  items: z
    .array(
      z.object({
        tierId: z.string().min(1),
        quantity: z.number().int().positive("Quantidade deve ser positiva."),
      })
    )
    .min(1),
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

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { eventId, items } = parsed.data;
  const buyerId = session.user.id!;

  // Validar evento
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Evento não disponível." }, { status: 400 });
  }
  if (new Date(event.startsAt) < new Date()) {
    return NextResponse.json({ error: "Evento já encerrado." }, { status: 400 });
  }

  // Pré-validar lotes fora da transaction (1 query em vez de N)
  const tierIds = items.map((i) => i.tierId);
  const tiers = await db.ticketTier.findMany({ where: { id: { in: tierIds } } });
  const tierMap = new Map(tiers.map((t) => [t.id, t]));

  for (const item of items) {
    const tier = tierMap.get(item.tierId);
    if (!tier || tier.eventId !== eventId) {
      return NextResponse.json({ error: "Lote de ingressos inválido." }, { status: 400 });
    }
    if (tier.soldQty + item.quantity > tier.totalQty) {
      return NextResponse.json({ error: "Ingressos insuficientes." }, { status: 400 });
    }
  }

  // Transaction atômica — re-verifica stock com SELECT FOR UPDATE e cria tudo junto
  try {
    const order = await db.$transaction(async (tx) => {
      let totalAmount = 0;
      const snapshots: { tier: { id: string; price: number | { toNumber: () => number }; soldQty: number; totalQty: number }; quantity: number }[] = [];

      // Re-lê todos os lotes de uma vez dentro da transaction (SELECT FOR UPDATE)
      const freshTiers = await tx.ticketTier.findMany({ where: { id: { in: tierIds } } });
      const freshMap = new Map(freshTiers.map((t) => [t.id, t]));

      for (const item of items) {
        const tier = freshMap.get(item.tierId);
        if (!tier || tier.soldQty + item.quantity > tier.totalQty) {
          throw new Error("STOCK_EXHAUSTED");
        }
        const price = typeof tier.price === "object" ? tier.price.toNumber() : Number(tier.price);
        totalAmount += price * item.quantity;
        snapshots.push({ tier, quantity: item.quantity });
      }

      const platformFeePercent = Number((event as { platformFeePercent?: number }).platformFeePercent ?? 7.5);
      const platformFee = totalAmount * (platformFeePercent / 100);

      const createdOrder = await tx.order.create({
        data: { buyerId, eventId, status: "PENDING", totalAmount, platformFee },
      });

      for (const { tier, quantity } of snapshots) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            tierId: tier.id,
            quantity,
            unitPrice: tier.price as number,
          },
        });

        await tx.ticketTier.update({
          where: { id: tier.id },
          data: { soldQty: { increment: quantity } },
        });

        for (let i = 0; i < quantity; i++) {
          await tx.ticket.create({
            data: {
              orderId: createdOrder.id,
              tierId: tier.id,
              token: randomBytes(16).toString("hex"),
              status: "ACTIVE",
            },
          });
        }
      }

      return createdOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "STOCK_EXHAUSTED") {
      return NextResponse.json({ error: "Ingressos insuficientes." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
