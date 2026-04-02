import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

function fmt(value: number) {
  return value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 animate-pulse">
      <div className="aspect-[4/3] bg-gray-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
        <div className="h-6 bg-gray-800 rounded w-1/3 mt-4" />
      </div>
    </div>
  );
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
      className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* Imagem */}
      <div className="relative aspect-[4/3] bg-gray-800 overflow-hidden">
        <Image
          src={event.imageUrl ?? `https://picsum.photos/seed/${event.id}/400/300`}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges topo esquerdo */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {featured && (
            <span className="bg-blue-400 text-black text-xs font-bold px-2.5 py-1 rounded-full shadow">
              ⭐ Destaque
            </span>
          )}
          {isBestSeller && !featured && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              🔥 Mais vendido
            </span>
          )}
          {isLastTickets && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow animate-pulse">
              ⚡ Últimos ingressos
            </span>
          )}
        </div>

        {/* Data topo direito */}
        <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "short",
          })}
        </span>

        {/* Esgotado overlay */}
        {soldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-sm font-bold px-4 py-1.5 rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-semibold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
          {event.title}
        </h3>
        <p className="text-sm text-gray-400 mt-1 line-clamp-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.venue}
        </p>
        <div className="mt-4 flex items-center justify-between">
          {minPrice !== null && !soldOut ? (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">A partir de</p>
              <p className="text-xl font-black text-blue-400 leading-tight">
                {fmt(minPrice)} <span className="text-sm font-semibold text-blue-300">MZN</span>
              </p>
            </div>
          ) : (
            <span />
          )}
          {!soldOut && (
            <span className="flex items-center gap-1 text-sm text-blue-400 font-semibold group-hover:gap-2 transition-all">
              Ver evento
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;

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
      <section className="relative bg-gray-950 overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80"
            alt=""
            fill
            className="object-cover opacity-25"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-gray-950" />
          {/* Animated colour blobs */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative w-full max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="inline-block text-blue-400 text-xs font-bold tracking-[0.2em] uppercase mb-6 bg-blue-400/10 border border-blue-400/20 px-4 py-2 rounded-full">
            🇲🇿 A plataforma de eventos de Moçambique
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-[1.05]">
            Vive cada momento.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
              Garante o teu lugar.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Concertos, festivais, teatro e muito mais. Compra ingressos com{" "}
            <span className="text-blue-400 font-semibold">M-Pesa</span> em segundos e recebe o teu QR code na hora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#events"
              className="bg-blue-400 text-black font-bold px-8 py-4 rounded-full hover:bg-blue-300 hover:scale-105 transition-all duration-200 text-base shadow-lg shadow-blue-400/30"
            >
              Explorar eventos →
            </a>
            <Link
              href={`/${locale}/auth/login`}
              className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-200 text-base backdrop-blur-sm"
            >
              Criar conta gratis
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 flex justify-center">
            <div className="flex flex-col items-center gap-1 text-gray-500 text-xs animate-bounce">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-800 bg-gray-950">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-black text-white">500+</p>
            <p className="text-sm text-gray-400 mt-1">Eventos realizados</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">50K+</p>
            <p className="text-sm text-gray-400 mt-1">Ingressos vendidos</p>
          </div>
          <div>
            <p className="text-3xl font-black text-blue-400">M-Pesa</p>
            <p className="text-sm text-gray-400 mt-1">Pagamento instantâneo</p>
          </div>
        </div>
      </section>

      <main id="events" className="bg-black">
        {/* Destaques */}
        {highlights.length > 0 && (
          <section className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white">Em destaque</h2>
                  <p className="text-gray-400 mt-1">Os eventos mais quentes desta semana</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            </div>
          </section>
        )}

        {/* Próximos eventos */}
        <section className="py-20 px-6 border-t border-gray-900">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white">Próximos eventos</h2>
                <p className="text-gray-400 mt-1">Não percas o que vem a seguir</p>
              </div>
            </div>

            {upcoming.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                {/* Skeleton preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30 mb-10">
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
                <p className="text-gray-400 text-lg">Nenhum evento disponível de momento.</p>
                <Link
                  href={`/${locale}/auth/login`}
                  className="inline-block bg-blue-400 text-black font-semibold px-6 py-3 rounded-full hover:bg-blue-300 transition-colors"
                >
                  Criar conta para ser notificado
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div>
              <p className="text-white font-bold text-lg mb-3">Ingresso MZ</p>
              <p className="text-sm leading-relaxed">A forma mais fácil de comprar ingressos para eventos em Moçambique. Paga com M-Pesa, recebe o QR code.</p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Plataforma</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#events" className="hover:text-blue-400 transition-colors">Eventos</a></li>
                <li><Link href={`/${locale}/auth/login`} className="hover:text-blue-400 transition-colors">Criar conta</Link></li>
                <li><Link href={`/${locale}/auth/login`} className="hover:text-blue-400 transition-colors">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Organizadores</p>
              <ul className="space-y-2 text-sm">
                <li><Link href={`/${locale}/auth/login`} className="hover:text-blue-400 transition-colors">Publicar evento</Link></li>
                <li><Link href={`/${locale}/organizer/dashboard`} className="hover:text-blue-400 transition-colors">Painel</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Ingresso MZ. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
