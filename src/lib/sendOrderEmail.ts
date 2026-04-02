import { generateTicketPdf } from "@/lib/pdf";
import { sendTicketEmail } from "@/lib/email";
import { db } from "@/lib/db";

/**
 * Gera PDF para o primeiro ticket da order e envia por email ao comprador.
 * Chama apenas quando a order passa a PAID.
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { name: true, email: true } },
      event: { select: { title: true, venue: true, startsAt: true } },
      tickets: { include: { tier: { select: { name: true } } } },
    },
  });

  if (!order) return;

  const activeTickets = order.tickets.filter((t) => t.status === "ACTIVE");
  if (activeTickets.length === 0) return;

  // Tier summary for email
  const tierCounts: Record<string, number> = {};
  for (const t of activeTickets) {
    tierCounts[t.tier.name] = (tierCounts[t.tier.name] ?? 0) + 1;
  }
  const tierSummary = Object.entries(tierCounts)
    .map(([name, qty]) => `${name} × ${qty}`)
    .join(", ");

  const startsAtStr = new Date(order.event.startsAt).toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Generate PDF for first ticket
  const ticket = activeTickets[0];
  const pdfBuffer = await generateTicketPdf({
    eventName: order.event.title,
    venue: order.event.venue,
    startsAt: startsAtStr,
    tierName: ticket.tier.name,
    buyerName: order.buyer.name ?? "—",
    buyerEmail: order.buyer.email,
    token: ticket.token,
    orderId: order.id,
    ticketId: ticket.id,
  });

  await sendTicketEmail({
    to: order.buyer.email,
    buyerName: order.buyer.name ?? "Cliente",
    eventName: order.event.title,
    venue: order.event.venue,
    startsAt: startsAtStr,
    tierName: tierSummary,
    orderId: order.id,
    pdfBuffer,
    ticketCount: activeTickets.length,
  });
}
