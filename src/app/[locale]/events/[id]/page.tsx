import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import BuyTickets from "./BuyTickets";

function fmt(value: number) {
  return value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function EventPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const session = await auth();

  const event = await db.event.findUnique({
    where: { id: params.id, status: "PUBLISHED" },
    include: {
      organizer: { select: { name: true } },
      tiers: {
        orderBy: { price: "asc" },
      },
    },
  });

  if (!event) notFound();

  const tiersData = event.tiers.map((t) => ({
    id: t.id,
    name: t.name,
    price: Number(t.price),
    totalQty: t.totalQty,
    soldQty: t.soldQty,
    salesEndAt: t.salesEndAt?.toISOString() ?? null,
    available: t.soldQty < t.totalQty && (!t.salesEndAt || new Date(t.salesEndAt) > new Date()),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-72 md:h-96 bg-gradient-to-br from-orange-500 to-orange-700">
        {event.imageUrl && (
          <Image src={event.imageUrl} alt={event.title} fill className="object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
          <p className="text-orange-200 text-sm">Organizado por {event.organizer.name}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sobre o evento</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Detalhes</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex gap-3">
                <dt className="text-gray-400 w-6">📍</dt>
                <dd className="text-gray-700">{event.venue}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-gray-400 w-6">🗓️</dt>
                <dd className="text-gray-700">
                  {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              {event.endsAt && (
                <div className="flex gap-3">
                  <dt className="text-gray-400 w-6">🏁</dt>
                  <dd className="text-gray-700">
                    Termina às{" "}
                    {new Date(event.endsAt).toLocaleTimeString("pt-MZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Compra */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-5">Ingressos</h2>

            <div className="space-y-3 mb-6">
              {tiersData.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-xl border p-3 text-sm ${
                    tier.available
                      ? "border-gray-200"
                      : "border-gray-100 opacity-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{tier.name}</span>
                    {!tier.available ? (
                      <span className="text-xs text-red-500 font-medium">Esgotado</span>
                    ) : (
                      <span className="font-semibold text-orange-600">{fmt(tier.price)} MZN</span>
                    )}
                  </div>
                  {tier.available && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tier.totalQty - tier.soldQty} disponíveis
                    </p>
                  )}
                </div>
              ))}
            </div>

            <BuyTickets
              eventId={event.id}
              tiers={tiersData}
              locale={params.locale}
              isLoggedIn={!!session?.user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
