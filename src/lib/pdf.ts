import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export interface TicketPdfProps {
  eventName: string;
  venue: string;
  startsAt: string;
  tierName: string;
  buyerName: string;
  buyerEmail: string;
  token: string;
  orderId: string;
  ticketId: string;
}

export async function generateTicketPdf(props: TicketPdfProps): Promise<Buffer> {
  const {
    eventName, venue, startsAt, tierName,
    buyerName, buyerEmail, token, orderId, ticketId,
  } = props;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // ── Header ──
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Ingresso MZ", 20, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("INGRESSO DIGITAL", W - 20, 18, { align: "right" });

  // ── Event title ──
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(eventName, W - 40);
  doc.text(titleLines, 20, 44);
  const titleHeight = titleLines.length * 8;

  // ── Tier ──
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(tierName.toUpperCase(), 20, 44 + titleHeight + 4);

  // ── Details ──
  let y = 44 + titleHeight + 18;
  const details = [
    ["Local:", venue],
    ["Data:", startsAt],
    ["Titular:", buyerName],
    ["Email:", buyerEmail],
  ];

  doc.setFontSize(10);
  for (const [label, value] of details) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(label, 20, y);
    doc.setTextColor(17, 24, 39);
    doc.text(value, 55, y);
    y += 7;
  }

  // ── Divider ──
  y += 4;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, y, W - 20, y);
  y += 10;

  // ── QR Code ──
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("APRESENTE ESTE QR CODE NA ENTRADA", W / 2, y, { align: "center" });
  y += 8;

  const qrDataUrl = await QRCode.toDataURL(token, {
    width: 320,
    margin: 1,
    color: { dark: "#111827", light: "#ffffff" },
  });
  const qrSize = 45;
  doc.addImage(qrDataUrl, "PNG", (W - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 8;

  // ── Order/Ticket ID ──
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(`Pedido #${orderId.slice(0, 8).toUpperCase()} · Ingresso #${ticketId.slice(0, 8).toUpperCase()}`, W / 2, y, { align: "center" });
  y += 6;

  // ── Warning ──
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Nao partilhe este QR code com terceiros", W / 2, y, { align: "center" });

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, footerY - 4, W - 20, footerY - 4);
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(7);
  doc.text("ingresso-mz.vercel.app", 20, footerY);
  doc.text("Este ingresso e pessoal e intransferivel.", W - 20, footerY, { align: "right" });

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
