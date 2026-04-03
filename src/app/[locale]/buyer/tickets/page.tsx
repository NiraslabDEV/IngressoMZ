import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { DownloadTicketButton } from "@/components/DownloadTicketButton";

async function getQR(token: string): Promise<string> {
  return QRCode.toDataURL(token, { width: 200, margin: 1 });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-500/20 text-green-400",
    USED: "bg-gray-500/20 text-gray-400",
    CANCELLED: "bg-red-500/20 text-red-400",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Válido",
    USED: "Utilizado",
    CANCELLED: "Cancelado",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function TicketsPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${params.locale}/auth/login`);

  const orders = await db.order.findMany({
    where: { buyerId: session.user.id!, status: "PAID" },
    include: {
      event: { select: { title: true, venue: true, startsAt: true, imageUrl: true } },
      tickets: {
        include: { tier: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Gerar QR codes em paralelo para ingressos activos
  const ticketsWithQR = await Promise.all(
    orders.flatMap((order) =>
      order.tickets.map(async (ticket) => ({
        ...ticket,
        qrDataUrl: ticket.status === "ACTIVE" ? await getQR(ticket.token) : null,
        event: order.event,
        orderId: order.id,
      }))
    )
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-black min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-8">Meus Ingressos</h1>

      {ticketsWithQR.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 py-16 text-center">
          <p className="text-5xl mb-4">🎟️</p>
          <p className="text-gray-400 mb-4">Ainda não compraste nenhum ingresso.</p>
          <Link
            href={`/${params.locale}`}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Ver eventos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ticketsWithQR.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-gray-900 rounded-2xl border overflow-hidden ${
                ticket.status === "ACTIVE" ? "border-gray-800" : "border-gray-800/50 opacity-70"
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm line-clamp-1">{ticket.event.title}</p>
                    <p className="text-blue-100 text-xs mt-0.5">{ticket.tier.name}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              </div>

              <div className="p-5 flex items-center gap-5">
                {/* QR Code — fundo branco para facilitar scan */}
                {ticket.qrDataUrl ? (
                  <div className="w-24 h-24 rounded-lg bg-white p-1 flex items-center justify-center">
                    <img
                      src={ticket.qrDataUrl}
                      alt="QR Code do ingresso"
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-800 flex items-center justify-center text-3xl">
                    {ticket.status === "USED" ? "✅" : "❌"}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 text-sm">
                  <p className="text-gray-400 flex items-center gap-1">
                    📍 <span className="truncate">{ticket.event.venue}</span>
                  </p>
                  <p className="text-gray-400 mt-1">
                    🗓️{" "}
                    {new Date(ticket.event.startsAt).toLocaleDateString("pt-MZ", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {ticket.status === "USED" && ticket.checkedInAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Entrada:{" "}
                      {new Date(ticket.checkedInAt).toLocaleTimeString("pt-MZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <Link
                      href={`/${params.locale}/buyer/orders/${ticket.orderId}`}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Ver pedido →
                    </Link>
                    {ticket.status === "ACTIVE" && (
                      <DownloadTicketButton token={ticket.token} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
