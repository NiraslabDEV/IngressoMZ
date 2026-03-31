import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

function fmt(value: number) {
  return value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EventCard({
  event,
  locale,
  featured,
}: {
  event: {
    id: string;
    title: string;
    venue: string;
    startsAt: Date;
    imageUrl: string | null;
    tiers: { price: number; soldQty: number; totalQty: number }[];
  };
  locale: string;
  featured?: boolean;
}) {
  const minPrice = event.tiers.length
    ? Math.min(...event.tiers.map((t) => t.price))
    : null;
  const soldOut = event.tiers.every((t) => t.soldQty >= t.totalQty);

  return (
    <Link
      href={`/${locale}/events/${event.id}`}
      className={`group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-200 ${
        featured ? "ring-2 ring-orange-400" : ""
      }`}
    >
      {/* Imagem */}
      <div className="relative h-44 bg-gradient-to-br from-orange-100 to-orange-50">
        {event.imageUrl ? (
          <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">🎵</div>
        )}
        {featured && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Destaque
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-sm font-bold px-4 py-1.5 rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">📍 {event.venue}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          🗓️{" "}
          {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="mt-3 flex items-center justify-between">
          {minPrice !== null && !soldOut ? (
            <span className="text-sm font-semibold text-orange-600">
              A partir de {fmt(minPrice)} MZN
            </span>
          ) : (
            <span />
          )}
          {!soldOut && (
            <span className="text-xs bg-orange-50 text-orange-600 font-medium px-3 py-1 rounded-full group-hover:bg-orange-500 group-hover:text-white transition-colors">
              Ver evento
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;

  // Eventos em destaque (highlights activos)
  const highlights = await db.eventHighlight.findMany({
    where: { startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
    orderBy: { position: "asc" },
    take: 4,
    include: {
      event: {
        include: {
          tiers: { select: { price: true, soldQty: true, totalQty: true } },
        },
      },
    },
  });

  const featuredIds = new Set(highlights.map((h) => h.eventId));

  // Próximos eventos publicados
  const upcoming = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { gte: new Date() },
      id: { notIn: Array.from(featuredIds) },
    },
    orderBy: { startsAt: "asc" },
    take: 12,
    include: {
      tiers: { select: { price: true, soldQty: true, totalQty: true } },
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Os melhores eventos de Moçambique
          </h1>
          <p className="text-orange-100 text-lg mb-8">
            Concertos, baladas, teatro, artes e muito mais. Compra o teu ingresso online.
          </p>
          <div className="inline-flex gap-3">
            <a
              href="#events"
              className="bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors"
            >
              Ver eventos
            </a>
            <Link
              href={`/${locale}/auth/register`}
              className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12" id="events">
        {/* Destaques */}
        {highlights.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔥 Eventos em Destaque</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {highlights.map((h) => (
                <EventCard
                  key={h.event.id}
                  event={{
                    ...h.event,
                    tiers: h.event.tiers.map((t) => ({
                      price: Number(t.price),
                      soldQty: t.soldQty,
                      totalQty: t.totalQty,
                    })),
                  }}
                  locale={locale}
                  featured
                />
              ))}
            </div>
          </section>
        )}

        {/* Próximos eventos */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 Próximos Eventos</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">🎭</p>
              <p>Nenhum evento disponível de momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    tiers: event.tiers.map((t) => ({
                      price: Number(t.price),
                      soldQty: t.soldQty,
                      totalQty: t.totalQty,
                    })),
                  }}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Ingresso MZ · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
