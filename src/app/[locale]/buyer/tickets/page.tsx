import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";

async function getQR(token: string): Promise<string> {
  return QRCode.toDataURL(token, { width: 200, margin: 1 });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    USED: "bg-gray-100 text-gray-500",
    CANCELLED: "bg-red-100 text-red-600",
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
  const session = await auth();
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
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Meus Ingressos</h1>

      {ticketsWithQR.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <p className="text-5xl mb-4">🎟️</p>
          <p className="text-gray-500 mb-4">Ainda não compraste nenhum ingresso.</p>
          <Link
            href={`/${params.locale}`}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Ver eventos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ticketsWithQR.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white rounded-2xl border overflow-hidden ${
                ticket.status === "ACTIVE" ? "border-gray-200" : "border-gray-100 opacity-70"
              }`}
            >
              {/* Header colorido */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm line-clamp-1">{ticket.event.title}</p>
                    <p className="text-orange-100 text-xs mt-0.5">{ticket.tier.name}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              </div>

              <div className="p-5 flex items-center gap-5">
                {/* QR Code */}
                {ticket.qrDataUrl ? (
                  <img
                    src={ticket.qrDataUrl}
                    alt="QR Code do ingresso"
                    className="w-24 h-24 rounded-lg border border-gray-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-3xl">
                    {ticket.status === "USED" ? "✅" : "❌"}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 text-sm">
                  <p className="text-gray-500 flex items-center gap-1">
                    📍 <span className="truncate">{ticket.event.venue}</span>
                  </p>
                  <p className="text-gray-500 mt-1">
                    🗓️{" "}
                    {new Date(ticket.event.startsAt).toLocaleDateString("pt-MZ", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {ticket.status === "USED" && ticket.checkedInAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Entrada:{" "}
                      {new Date(ticket.checkedInAt).toLocaleTimeString("pt-MZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  <Link
                    href={`/${params.locale}/buyer/orders/${ticket.orderId}`}
                    className="text-xs text-orange-600 hover:underline mt-2 inline-block"
                  >
                    Ver pedido →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
