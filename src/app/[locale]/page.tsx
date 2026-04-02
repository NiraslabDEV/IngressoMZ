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
      className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Imagem */}
      <div className="relative aspect-[4/3] bg-gray-800 overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-gray-600"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        {featured && (
          <span className="absolute top-3 left-3 bg-blue-400 text-black text-xs font-semibold px-3 py-1 rounded-full">
            Destaque
          </span>
        )}
        <span className="absolute top-3 right-3 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        {soldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-sm font-bold px-4 py-1.5 rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-semibold text-white line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{event.venue}</p>
        <div className="mt-3 flex items-center justify-between">
          {minPrice !== null && !soldOut ? (
            <span className="text-lg font-bold text-blue-400">
              {fmt(minPrice)} MZN
            </span>
          ) : (
            <span />
          )}
          {!soldOut && (
            <span className="text-sm text-blue-400 font-medium group-hover:text-blue-300">
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
      <section className="relative bg-gray-950 overflow-hidden">
        {/* Background image from Unsplash */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/80 to-gray-950" />
        </div>
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
      </section>

      {/* Stats bar */}
      <section className="border-b border-gray-800 bg-black/50">
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
      </section>

      <main id="events">
        {/* Destaques */}
        {highlights.length > 0 && (
          <section className="py-20 px-6 bg-gray-950/50">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-white">Em destaque</h2>
              <p className="text-gray-400 mt-2 mb-10">Os eventos mais quentes desta semana</p>
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
        <section className="py-20 px-6 bg-black/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white">Proximos eventos</h2>
            <p className="text-gray-400 mt-2 mb-10">Nao percas o que vem a seguir</p>
            {upcoming.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-300 mb-6">Nenhum evento disponivel de momento.</p>
                <Link
                  href={`/${locale}/auth/register`}
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
      <footer className="bg-black text-gray-400 mt-20 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div>
              <p className="text-white font-bold text-lg mb-3 flex items-center gap-2">Ingresso MZ</p>
              <p className="text-sm leading-relaxed">A forma mais facil de comprar ingressos para eventos em Mocambique. Paga com M-Pesa, recebe o QR code.</p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Plataforma</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#events" className="text-gray-400 hover:text-blue-400 transition-colors">Eventos</a></li>
                <li><Link href={`/${locale}/auth/register`} className="text-gray-400 hover:text-blue-400 transition-colors">Criar conta</Link></li>
                <li><Link href={`/${locale}/auth/login`} className="text-gray-400 hover:text-blue-400 transition-colors">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Organizadores</p>
              <ul className="space-y-2 text-sm">
                <li><Link href={`/${locale}/auth/register`} className="text-gray-400 hover:text-blue-400 transition-colors">Publicar evento</Link></li>
                <li><Link href={`/${locale}/organizer/dashboard`} className="text-gray-400 hover:text-blue-400 transition-colors">Painel</Link></li>
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
