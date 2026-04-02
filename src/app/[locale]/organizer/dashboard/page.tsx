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
    DRAFT: "bg-gray-800 text-gray-300",
    PUBLISHED: "bg-green-950 text-green-400",
    CANCELLED: "bg-red-950 text-red-400",
    FINISHED: "bg-blue-950 text-blue-400",
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
    <div className="min-h-screen bg-black p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link
          href={`/${params.locale}/organizer/events/new`}
          className="bg-blue-400 hover:bg-blue-300 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Criar Evento
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Arrecadado</p>
          <p className="text-2xl font-bold text-white">{fmt(totals.gross)}</p>
          <p className="text-xs text-gray-400 mt-1">MZN</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Taxa Plataforma</p>
          <p className="text-2xl font-bold text-blue-400">{fmt(totals.fee)}</p>
          <p className="text-xs text-gray-400 mt-1">MZN</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">A Receber</p>
          <p className="text-2xl font-bold text-green-400">{fmt(totals.net)}</p>
          <p className="text-xs text-gray-400 mt-1">MZN — pago após o evento</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ingressos Vendidos</p>
          <p className="text-2xl font-bold text-white">{totals.tickets}</p>
          <p className="text-xs text-gray-400 mt-1">unidades</p>
        </div>
      </div>

      {/* Aviso de repasse */}
      <div className="bg-blue-950/30 border border-blue-800 rounded-xl px-5 py-4 mb-8 text-sm text-blue-300">
        <strong>Como funciona o repasse:</strong> O valor líquido é transferido para o seu M-Pesa
        após o encerramento do evento. Certifique-se de que o seu número de M-Pesa está actualizado
        no perfil.
      </div>

      {/* Tabela por evento */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Ganhos por Evento</h2>
        </div>

        {eventsData.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Nenhum evento criado ainda.{" "}
            <Link href={`/${params.locale}/organizer/events/new`} className="text-blue-400 hover:text-blue-300">
              Criar primeiro evento
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Evento</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-right px-6 py-3 font-medium">Ingressos</th>
                  <th className="text-right px-6 py-3 font-medium">Bruto (MZN)</th>
                  <th className="text-right px-6 py-3 font-medium">Taxa (MZN)</th>
                  <th className="text-right px-6 py-3 font-medium">Líquido (MZN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {eventsData.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/${params.locale}/organizer/events/${event.id}/edit`}
                        className="font-medium text-white hover:text-blue-400 transition-colors"
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
                    <td className="px-6 py-4 text-right text-gray-300">
                      {event.soldQty}
                      <span className="text-gray-500">/{event.totalQty}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300">{fmt(event.gross)}</td>
                    <td className="px-6 py-4 text-right text-blue-400">{fmt(event.fee)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-400">
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
