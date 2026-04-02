import { Resend } from "resend";

// Lazy init — evita erro de build quando RESEND_API_KEY não está definida em dev/CI
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}
const FROM = process.env.EMAIL_FROM ?? "Ingresso MZ <noreply@ingressomz.com>";

export interface TicketEmailData {
  to: string;
  buyerName: string;
  eventName: string;
  venue: string;
  startsAt: string;
  tierName: string;
  orderId: string;
  pdfBuffer: Buffer;
  ticketCount: number;
}

export async function sendTicketEmail(data: TicketEmailData) {
  const { to, buyerName, eventName, venue, startsAt, tierName, orderId, pdfBuffer, ticketCount } = data;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🎟️ O teu ingresso para ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f9fafb; padding: 0;">
        <!-- Header -->
        <div style="background: #1e3a5f; padding: 24px 32px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; letter-spacing: 1px;">Ingresso MZ</h1>
        </div>

        <!-- Body -->
        <div style="background: #ffffff; padding: 32px;">
          <p style="color: #111827; font-size: 16px; margin: 0 0 8px;">Olá, <strong>${buyerName}</strong>!</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 24px;">
            O teu pagamento foi confirmado. Aqui estão os teus ingressos para <strong>${eventName}</strong>.
          </p>

          <!-- Event details box -->
          <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #374151;">
              <tr>
                <td style="padding: 5px 0; color: #6b7280; width: 80px;">Evento</td>
                <td style="padding: 5px 0; font-weight: bold; color: #111827;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">Lote</td>
                <td style="padding: 5px 0;">${tierName} × ${ticketCount}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">Local</td>
                <td style="padding: 5px 0;">${venue}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">Data</td>
                <td style="padding: 5px 0;">${startsAt}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">Pedido</td>
                <td style="padding: 5px 0; font-family: monospace;">#${orderId.slice(0, 8).toUpperCase()}</td>
              </tr>
            </table>
          </div>

          <p style="color: #374151; font-size: 13px; margin: 0 0 8px;">
            📎 O teu ingresso em PDF está em anexo. Abre-o e apresenta o QR code na entrada do evento.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            ⚠️ Este ingresso é pessoal e intransferível. Não partilhes o QR code com terceiros.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Ingresso MZ · Moçambique</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `ingresso-${orderId.slice(0, 8)}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
