import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function EventsPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);

  const events = await db.event.findMany({
    where: { organizerId: session!.user!.id! },
    include: {
      tiers: { select: { soldQty: true, totalQty: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Meus Eventos</h1>
        <Link
          href={`/${params.locale}/organizer/events/new`}
          className="bg-blue-400 hover:bg-blue-300 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Criar Evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 px-6 py-16 text-center">
          <p className="text-gray-400 text-sm mb-4">Nenhum evento criado ainda.</p>
          <Link
            href={`/${params.locale}/organizer/events/new`}
            className="bg-blue-400 hover:bg-blue-300 text-black text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Criar primeiro evento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const soldQty = event.tiers.reduce((s, t) => s + t.soldQty, 0);
            const totalQty = event.tiers.reduce((s, t) => s + t.totalQty, 0);
            const pct = totalQty > 0 ? Math.round((soldQty / totalQty) * 100) : 0;

            return (
              <div
                key={event.id}
                className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{event.title}</h3>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="text-sm text-gray-400">
                    📍 {event.venue} &nbsp;·&nbsp;{" "}
                    {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {event.status === "DRAFT" && (
                    <p className="text-xs text-blue-400 mt-1">
                      ⚠️ Rascunho — edita e muda para <strong>Publicado</strong> para aparecer na homepage
                    </p>
                  )}
                </div>

                {/* Barra de ingressos */}
                <div className="w-full md:w-40 shrink-0">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Ingressos</span>
                    <span>
                      {soldQty}/{totalQty} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Acções */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  <Link
                    href={`/${params.locale}/organizer/events/${event.id}/edit`}
                    className="flex-1 md:flex-none text-sm text-gray-300 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-center"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/${params.locale}/organizer/events/${event.id}/checkin`}
                    className="flex-1 md:flex-none text-sm text-blue-400 hover:text-blue-300 border border-blue-900 px-3 py-1.5 rounded-lg hover:bg-blue-950 transition-colors text-center"
                  >
                    Check-in
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
