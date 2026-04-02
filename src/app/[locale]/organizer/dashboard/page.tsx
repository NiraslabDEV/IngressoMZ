import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmt(value: number) {
  return value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PUBLISHED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    FINISHED: "bg-blue-100 text-blue-700",
  };
  const labels: Record<string, string> = {
    DRAFT: "Rascunho",
    PUBLISHED: "Publicado",
    CANCELLED: "Cancelado",
    FINISHED: "Finalizado",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);

  const events = await db.event.findMany({
    where: { organizerId: session!.user!.id! },
    include: {
      orders: {
        where: { status: "PAID" },
        select: { totalAmount: true, platformFee: true },
      },
      tiers: { select: { soldQty: true, totalQty: true } },
    },
    orderBy: { startsAt: "desc" },
  });

  const eventsData = events.map((event) => {
    const gross = event.orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const fee = event.orders.reduce((s, o) => s + Number(o.platformFee), 0);
    const net = gross - fee;
    const soldQty = event.tiers.reduce((s, t) => s + t.soldQty, 0);
    const totalQty = event.tiers.reduce((s, t) => s + t.totalQty, 0);
    return { ...event, gross, fee, net, soldQty, totalQty };
  });

  const totals = eventsData.reduce(
    (acc, e) => ({
      gross: acc.gross + e.gross,
      fee: acc.fee + e.fee,
      net: acc.net + e.net,
      tickets: acc.tickets + e.soldQty,
    }),
    { gross: 0, fee: 0, net: 0, tickets: 0 }
  );

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href={`/${params.locale}/organizer/events/new`}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Criar Evento
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Arrecadado</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(totals.gross)}</p>
          <p className="text-xs text-gray-400 mt-1">MZN</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Taxa Plataforma</p>
          <p className="text-2xl font-bold text-orange-500">{fmt(totals.fee)}</p>
          <p className="text-xs text-gray-400 mt-1">MZN</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">A Receber</p>
          <p className="text-2xl font-bold text-green-600">{fmt(totals.net)}</p>
          <p className="text-xs text-gray-400 mt-1">MZN — pago após o evento</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ingressos Vendidos</p>
          <p className="text-2xl font-bold text-gray-900">{totals.tickets}</p>
          <p className="text-xs text-gray-400 mt-1">unidades</p>
        </div>
      </div>

      {/* Aviso de repasse */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-8 text-sm text-blue-800">
        <strong>Como funciona o repasse:</strong> O valor líquido é transferido para o seu M-Pesa
        após o encerramento do evento. Certifique-se de que o seu número de M-Pesa está actualizado
        no perfil.
      </div>

      {/* Tabela por evento */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Ganhos por Evento</h2>
        </div>

        {eventsData.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Nenhum evento criado ainda.{" "}
            <Link href={`/${params.locale}/organizer/events/new`} className="text-orange-500 hover:underline">
              Criar primeiro evento
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Evento</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-right px-6 py-3 font-medium">Ingressos</th>
                  <th className="text-right px-6 py-3 font-medium">Bruto (MZN)</th>
                  <th className="text-right px-6 py-3 font-medium">Taxa (MZN)</th>
                  <th className="text-right px-6 py-3 font-medium">Líquido (MZN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eventsData.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/${params.locale}/organizer/events/${event.id}/edit`}
                        className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                      >
                        {event.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {event.soldQty}
                      <span className="text-gray-400">/{event.totalQty}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">{fmt(event.gross)}</td>
                    <td className="px-6 py-4 text-right text-orange-500">{fmt(event.fee)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      {fmt(event.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
