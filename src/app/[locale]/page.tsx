import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { HighlightsCarousel } from "@/components/HighlightsCarousel";

/* ─── Hero animado com glassmorphism ──────────────────────────────────────── */
function HeroSection({ locale }: { locale: string }) {
  return (
    <section className="relative bg-gray-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80"
          alt=""
          fill
          className="w-full h-full object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/80 to-gray-950" />
      </div>

      {/* Conteúdo */}
      <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
        <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4 animate-fade-in">
          A plataforma de eventos de Moçambique
        </p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 animate-fade-up">
          Vive cada momento.<br />
          <span className="text-blue-400">Garante o teu lugar.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Concertos, festivais, teatro e muito mais. Compra ingressos com M-Pesa em segundos e recebe o teu QR code na hora.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <a href="#events" className="bg-blue-400 text-black font-semibold px-8 py-4 rounded-full hover:bg-blue-300 transition-colors duration-200 text-base">
            Explorar eventos
          </a>
          <Link href={`/${locale}/auth/register`} className="border border-blue-400/30 text-white font-semibold px-8 py-4 rounded-full hover:bg-blue-400/10 transition-colors duration-200 text-base backdrop-blur-sm">
            Criar conta gratis
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative border-t border-gray-800 bg-black/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-sm text-gray-400 mt-1">Eventos realizados</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">50K+</p>
            <p className="text-sm text-gray-400 mt-1">Ingressos vendidos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-400">M-Pesa</p>
            <p className="text-sm text-gray-400 mt-1">Pagamento instantaneo</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(value: number) {
  return value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Card compacto — grelha próximos eventos ─────────────────────────────── */
function EventCard({
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
      className="group block rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-200"
    >
      <div className="relative aspect-[3/4] bg-gray-800 overflow-hidden rounded-xl">
        <Image
          src={event.imageUrl ?? `https://picsum.photos/seed/${event.id}/300/400`}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isBestSeller && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              🔥 Mais vendido
            </span>
          )}
          {isLastTickets && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow animate-pulse">
              ⚡ Últimos
            </span>
          )}
        </div>

        {/* Data */}
        <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {new Date(event.startsAt).toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" })}
        </span>

        {soldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">Esgotado</span>
          </div>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/60 to-transparent px-3 pt-8 pb-3">
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
    take: 8,
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
    take: 24,
    include: {
      tiers: { select: { price: true, soldQty: true, totalQty: true } },
    },
  });

  const highlightEvents = highlights.map((h) => ({
    id: h.event.id,
    title: h.event.title,
    venue: h.event.venue,
    startsAt: h.event.startsAt,
    imageUrl: h.event.imageUrl,
    tiers: h.event.tiers.map((t) => ({
      price: Number(t.price),
      soldQty: t.soldQty,
      totalQty: t.totalQty,
    })),
  }));

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Hero Section ── */}
      <HeroSection locale={locale} />

      {/* ── Destaques: carrossel de cards grandes ── */}
      {highlightEvents.length > 0 && (
        <section className="pt-8 pb-4">
          <div className="max-w-[1400px] mx-auto px-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Destaques</p>
            <HighlightsCarousel events={highlightEvents} locale={locale} />
          </div>
        </section>
      )}

      {/* ── Banner wide do primeiro destaque ── */}
      {highlightEvents[0] && (
        <section className="max-w-[1400px] mx-auto px-4 mt-4 mb-6">
          <Link
            href={`/${locale}/events/${highlightEvents[0].id}`}
            className="group relative block w-full rounded-2xl overflow-hidden"
          >
            <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-gray-900">
              <Image
                src={highlightEvents[0].imageUrl ?? `https://picsum.photos/seed/${highlightEvents[0].id}/1200/400`}
                alt={highlightEvents[0].title}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-10">
              <span className="inline-block bg-blue-400 text-black text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit">
                ⭐ Em destaque
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-white line-clamp-2 mb-2 max-w-lg">
                {highlightEvents[0].title}
              </h2>
              <p className="text-sm text-gray-300 mb-4 flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {highlightEvents[0].venue} ·{" "}
                {new Date(highlightEvents[0].startsAt).toLocaleDateString("pt-MZ", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
              <div className="flex items-center gap-3">
                {highlightEvents[0].tiers.length > 0 && (
                  <span className="text-white font-black text-xl">
                    {fmt(Math.min(...highlightEvents[0].tiers.map((t) => t.price)))}{" "}
                    <span className="text-sm font-medium text-gray-300">MZN</span>
                  </span>
                )}
                <span className="bg-white text-black text-sm font-bold px-5 py-2 rounded-full group-hover:bg-blue-400 transition-colors">
                  Comprar ingresso →
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Próximos eventos ── */}
      <section className="max-w-[1400px] mx-auto px-4 pb-20" id="events">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Próximos eventos</p>

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 border-t border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 py-12">
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
