import { renderToBuffer } from "@react-pdf/renderer";
import { TicketPdfDocument } from "@/lib/pdf";
import { sendTicketEmail } from "@/lib/email";
import { db } from "@/lib/db";

/**
 * Gera PDF para todos os tickets de uma order e envia por email ao comprador.
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

  // Agrupar tickets por tier para nome no email
  const tierCounts: Record<string, number> = {};
  for (const t of order.tickets) {
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

  // Gerar PDF do primeiro ticket activo (PDF por ingresso individual)
  // Se tiver vários, geramos um PDF por ticket em anexo separado — por simplicidade usamos só o primeiro
  // Para múltiplos tickets, podes expandir para múltiplos attachments
  const activeTickets = order.tickets.filter((t) => t.status === "ACTIVE");
  if (activeTickets.length === 0) return;

  const pdfBuffers = await Promise.all(
    activeTickets.map(async (ticket) => {
      const doc = await TicketPdfDocument({
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
      return { buffer: await renderToBuffer(doc), ticketId: ticket.id };
    })
  );

  // Envia email com o primeiro PDF em anexo (Resend free tier: 1 attachment)
  // Se quiseres múltiplos anexos, substitui pelo array completo
  await sendTicketEmail({
    to: order.buyer.email,
    buyerName: order.buyer.name ?? "Cliente",
    eventName: order.event.title,
    venue: order.event.venue,
    startsAt: startsAtStr,
    tierName: tierSummary,
    orderId: order.id,
    pdfBuffer: pdfBuffers[0].buffer,
    ticketCount: activeTickets.length,
  });
}
