"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  venue: string;
  startsAt: Date;
  imageUrl: string | null;
  tiers: { price: number; soldQty: number; totalQty: number }[];
}

export function HighlightsCarousel({ events, locale }: { events: Event[]; locale: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <div className="relative group/carousel">
      {/* Seta esquerda */}
      <button
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Seta direita */}
      <button
        onClick={() => scroll("right")}
        aria-label="Próximo"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {events.map((event) => {
          const minPrice = event.tiers.length
            ? Math.min(...event.tiers.map((t) => t.price))
            : null;

          return (
            <Link
              key={event.id}
              href={`/${locale}/events/${event.id}`}
              className="group relative flex-shrink-0 rounded-2xl overflow-hidden"
              style={{ scrollSnapAlign: "start", width: "clamp(160px, 22vw, 280px)" }}
            >
              {/* Flyer retrato grande */}
              <div className="relative bg-gray-800" style={{ aspectRatio: "3/4" }}>
                <Image
                  src={event.imageUrl ?? `https://picsum.photos/seed/${event.id}/280/373`}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Info */}
                <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
                  <p className="text-white font-bold text-sm line-clamp-2 leading-snug">{event.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{event.venue}</p>
                  <div className="flex items-center justify-between mt-2">
                    {minPrice !== null && (
                      <span className="text-blue-400 font-black text-sm">
                        {minPrice.toLocaleString("pt-MZ", { minimumFractionDigits: 0 })}
                        <span className="text-[10px] font-normal text-blue-300"> MZN</span>
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(event.startsAt).toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
