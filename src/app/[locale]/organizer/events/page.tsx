import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

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
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function EventsPage({ params }: { params: { locale: string } }) {
  const session = await auth();

  const events = await db.event.findMany({
    where: { organizerId: session!.user!.id! },
    include: {
      tiers: { select: { soldQty: true, totalQty: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meus Eventos</h1>
        <Link
          href={`/${params.locale}/organizer/events/new`}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Criar Evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-sm mb-4">Nenhum evento criado ainda.</p>
          <Link
            href={`/${params.locale}/organizer/events/new`}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
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
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    📍 {event.venue} &nbsp;·&nbsp;{" "}
                    {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Barra de ingressos */}
                <div className="w-40 shrink-0">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Ingressos</span>
                    <span>
                      {soldQty}/{totalQty} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Acções */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/${params.locale}/organizer/events/${event.id}/edit`}
                    className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/${params.locale}/organizer/events/${event.id}/checkin`}
                    className="text-sm text-orange-600 hover:text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
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
