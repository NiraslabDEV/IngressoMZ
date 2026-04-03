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
  mainArtist: string | null;
  organizerName: string;
  organizerInitials: string;
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
      <button
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="absolute left-2 top-1/3 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => scroll("right")}
        aria-label="Próximo"
        className="absolute right-2 top-1/3 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {events.map((event) => {
          const minPrice = event.tiers.length
            ? Math.min(...event.tiers.map((t) => t.price))
            : null;

          const dateObj = new Date(event.startsAt);
          const month = dateObj.toLocaleDateString("pt-MZ", { month: "short" }).toUpperCase().replace(".", "");
          const day = dateObj.toLocaleDateString("pt-MZ", { day: "2-digit" });
          const weekday = dateObj.toLocaleDateString("pt-MZ", { weekday: "short" }).toUpperCase().replace(".", "");
          const time = dateObj.toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" });

          return (
            <Link
              key={event.id}
              href={`/${locale}/events/${event.id}`}
              className="group flex-shrink-0 bg-gray-950 rounded-xl overflow-hidden"
              style={{ scrollSnapAlign: "start", width: "clamp(200px, 24vw, 300px)" }}
            >
              {/* Flyer limpo */}
              <div className="relative bg-gray-800" style={{ aspectRatio: "3/4" }}>
                <Image
                  src={event.imageUrl ?? `https://picsum.photos/seed/${event.id}/300/400`}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Info por baixo */}
              <div className="p-3">
                <div className="flex gap-2.5 items-start mb-2">
                  <div className="flex-shrink-0 w-11 bg-gray-900 border border-gray-800 rounded-lg text-center py-1">
                    <p className="text-[8px] font-bold text-blue-400 uppercase leading-none">{month}</p>
                    <p className="text-base font-black text-white leading-tight">{day}</p>
                    <p className="text-[8px] font-semibold text-gray-500 uppercase leading-none">{weekday}</p>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[10px] text-gray-400">Abertura: {time}</p>
                    <p className="text-[10px] text-gray-400 truncate">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">{event.organizerInitials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold line-clamp-2 leading-snug">{event.title}</p>
                    {event.mainArtist && (
                      <p className="text-gray-500 text-[10px] mt-0.5 line-clamp-1">{event.mainArtist}</p>
                    )}
                  </div>
                </div>

                {minPrice !== null && (
                  <div className="mt-2 pt-1.5 border-t border-gray-800">
                    <p className="text-blue-400 font-black text-xs">
                      {minPrice.toLocaleString("pt-MZ", { minimumFractionDigits: 0 })}
                      <span className="text-[9px] font-normal text-gray-500"> MZN</span>
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
