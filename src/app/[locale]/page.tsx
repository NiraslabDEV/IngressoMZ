import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

function fmt(value: number) {
  return value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Banner de destaque (ocupa largura toda) ─────────────────────────────── */
function FeaturedBanner({
  event,
  locale,
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
}) {
  const minPrice = event.tiers.length
    ? Math.min(...event.tiers.map((t) => t.price))
    : null;

  return (
    <Link
      href={`/${locale}/events/${event.id}`}
      className="group relative block w-full rounded-xl overflow-hidden"
    >
      <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-gray-900">
        <Image
          src={event.imageUrl ?? `https://picsum.photos/seed/${event.id}/1200/400`}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
        <span className="inline-block bg-blue-400 text-black text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">
          ⭐ Em destaque
        </span>
        <h2 className="text-xl md:text-3xl font-black text-white line-clamp-2 mb-1">
          {event.title}
        </h2>
        <p className="text-sm text-gray-300 mb-3 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.venue} ·{" "}
          {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="flex items-center gap-3">
          {minPrice !== null && (
            <span className="text-white font-black text-lg">
              {fmt(minPrice)} <span className="text-sm font-medium text-gray-300">MZN</span>
            </span>
          )}
          <span className="bg-white text-black text-sm font-bold px-4 py-1.5 rounded-full group-hover:bg-blue-400 transition-colors">
            Comprar ingresso →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Card compacto (flyer retrato) ───────────────────────────────────────── */
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
  const tiers = event.tiers;
  const minPrice = tiers.length ? Math.min(...tiers.map((t) => t.price)) : null;
  const soldOut = tiers.every((t) => t.soldQty >= t.totalQty);
  const totalSold = tiers.reduce((a, t) => a + t.soldQty, 0);
  const totalQty = tiers.reduce((a, t) => a + t.totalQty, 0);
  const remaining = totalQty - totalSold;
  const isLastTickets = !soldOut && remaining > 0 && remaining <= Math.ceil(totalQty * 0.1);
  const isBestSeller = !soldOut && totalSold >= Math.ceil(totalQty * 0.7);

  return (
    <Link
      href={`/${locale}/events/${event.id}`}
      className="group block bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1 transition-all duration-200"
    >
      {/* Flyer retrato */}
      <div className="relative aspect-[3/4] bg-gray-800 overflow-hidden">
        <Image
          src={event.imageUrl ?? `https://picsum.photos/seed/${event.id}/300/400`}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {featured && (
            <span className="bg-blue-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
              ⭐ Destaque
            </span>
          )}
          {isBestSeller && !featured && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              🔥 Mais vendido
            </span>
          )}
          {isLastTickets && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              ⚡ Últimos
            </span>
          )}
        </div>

        {/* Data */}
        <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "short",
          })}
        </span>

        {/* Esgotado */}
        {soldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
              Esgotado
            </span>
          </div>
        )}

        {/* Info overlay no fundo */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3">
          <p className="text-white font-bold text-xs line-clamp-2 leading-snug">{event.title}</p>
          <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-1">{event.venue}</p>
          {minPrice !== null && !soldOut && (
            <p className="text-blue-400 font-black text-sm mt-1">
              {fmt(minPrice)} <span className="text-[10px] font-normal text-blue-300">MZN</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Página ──────────────────────────────────────────────────────────────── */
export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;

  const highlights = await db.eventHighlight.findMany({
    where: { startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
    orderBy: { position: "asc" },
    take: 6,
    include: {
      event: {
        include: {
          tiers: { select: { price: true, soldQty: true, totalQty: true } },
        },
      },
    },
  });

  const featuredIds = new Set(highlights.map((h) => h.eventId));

  const upcoming = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { gte: new Date() },
      id: { notIn: Array.from(featuredIds) },
    },
    orderBy: { startsAt: "asc" },
    take: 20,
    include: {
      tiers: { select: { price: true, soldQty: true, totalQty: true } },
    },
  });

  // Primeiro highlight vira banner; o resto vira cards pequenos
  const [bannerHighlight, ...restHighlights] = highlights;

  const normalizeEvent = (e: typeof upcoming[0]) => ({
    ...e,
    tiers: e.tiers.map((t) => ({
      price: Number(t.price),
      soldQty: t.soldQty,
      totalQty: t.totalQty,
    })),
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Hero compacto */}
      <section className="relative bg-gray-950 overflow-hidden py-14 md:py-20">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80"
            alt=""
            fill
            className="object-cover opacity-15"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-gray-950" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 leading-tight">
            Os melhores eventos<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
              de Moçambique
            </span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-7">
            Compra com M-Pesa. Recebe o QR code. Entra sem filas.
          </p>
          <a
            href="#events"
            className="inline-block bg-blue-400 text-black font-bold px-7 py-3 rounded-full hover:bg-blue-300 transition-colors shadow-lg shadow-blue-400/20"
          >
            Ver todos os eventos →
          </a>
        </div>
      </section>

      <main id="events" className="max-w-6xl mx-auto px-4 pb-20">

        {/* Stories de destaques — scroll horizontal acima do banner */}
        {highlights.length > 0 && (
          <section className="mt-8 mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 px-0.5">
              Destaques
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {highlights.map((h) => {
                const ev = h.event;
                const minPrice = ev.tiers.length
                  ? Math.min(...ev.tiers.map((t) => Number(t.price)))
                  : null;
                return (
                  <Link
                    key={ev.id}
                    href={`/${locale}/events/${ev.id}`}
                    className="group relative flex-shrink-0 w-28 sm:w-32 rounded-xl overflow-hidden"
                  >
                    <div className="relative w-full aspect-[9/16] bg-gray-800">
                      <Image
                        src={ev.imageUrl ?? `https://picsum.photos/seed/${ev.id}/180/320`}
                        alt={ev.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 inset-x-0 p-2">
                        <p className="text-white text-[11px] font-bold line-clamp-2 leading-snug">
                          {ev.title}
                        </p>
                        {minPrice !== null && (
                          <p className="text-blue-400 text-[11px] font-black mt-0.5">
                            {minPrice.toLocaleString("pt-MZ", { minimumFractionDigits: 0 })} MZN
                          </p>
                        )}
                      </div>
                      <span className="absolute top-2 left-2 bg-blue-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        ⭐
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Banner destaque (primeiro highlight, largo) */}
        {bannerHighlight && (
          <section className="mb-6">
            <FeaturedBanner
              event={{
                ...bannerHighlight.event,
                tiers: bannerHighlight.event.tiers.map((t) => ({
                  price: Number(t.price),
                  soldQty: t.soldQty,
                  totalQty: t.totalQty,
                })),
              }}
              locale={locale}
            />
          </section>
        )}

        {/* Próximos eventos */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Próximos eventos
          </h2>

          {upcoming.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4">Nenhum evento disponível de momento.</p>
              <Link
                href={`/${locale}/auth/login`}
                className="inline-block bg-blue-400 text-black font-semibold px-6 py-3 rounded-full hover:bg-blue-300 transition-colors"
              >
                Criar conta para ser notificado
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={normalizeEvent(event)}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <p className="text-white font-bold text-base mb-2">Ingresso MZ</p>
              <p className="text-sm leading-relaxed">A forma mais fácil de comprar ingressos em Moçambique. Paga com M-Pesa, recebe o QR code.</p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Plataforma</p>
              <ul className="space-y-1.5 text-sm">
                <li><a href="#events" className="hover:text-blue-400 transition-colors">Eventos</a></li>
                <li><Link href={`/${locale}/auth/login`} className="hover:text-blue-400 transition-colors">Criar conta</Link></li>
                <li><Link href={`/${locale}/auth/login`} className="hover:text-blue-400 transition-colors">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Organizadores</p>
              <ul className="space-y-1.5 text-sm">
                <li><Link href={`/${locale}/auth/login`} className="hover:text-blue-400 transition-colors">Publicar evento</Link></li>
                <li><Link href={`/${locale}/organizer/dashboard`} className="hover:text-blue-400 transition-colors">Painel</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Ingresso MZ. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
