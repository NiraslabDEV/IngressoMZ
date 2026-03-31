import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, tickets: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  // Ownership check — comprador só acessa os seus próprios pedidos
  if (order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  return NextResponse.json(order);
}
