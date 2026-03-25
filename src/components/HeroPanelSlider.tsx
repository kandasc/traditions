"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SmartImage } from "@/components/SmartImage";

export type HeroSlideItem = {
  id: string;
  imageUrl: string;
  alt?: string | null;
  href?: string | null;
};

type Props = {
  slides: HeroSlideItem[];
  fallbackUrl: string;
  fallbackAlt?: string;
};

export function HeroPanelSlider({ slides, fallbackUrl, fallbackAlt }: Props) {
  const activeSlides =
    slides.length > 0
      ? slides
      : [{ id: "fallback", imageUrl: fallbackUrl, alt: fallbackAlt ?? null }];

  const [index, setIndex] = useState(0);
  const len = activeSlides.length;
  const current = activeSlides[Math.min(index, len - 1)];

  const go = useCallback(
    (d: number) => {
      setIndex((i) => (i + d + len) % len);
    },
    [len],
  );

  useEffect(() => {
    if (len <= 1) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [len, go]);

  const inner = (
    <div className="relative aspect-[4/3] w-full">
      <SmartImage
        key={current.id}
        src={current.imageUrl}
        alt={current.alt ?? fallbackAlt ?? "Traditions"}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
        fallbackClassName="bg-black/25"
        proxyWidth={1100}
        proxyQuality={72}
      />
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_45%)]" />
      <div className="relative">
        {current.href ? (
          <Link href={current.href} className="block">
            {inner}
          </Link>
        ) : (
          inner
        )}
        {len > 1 ? (
          <>
            <button
              type="button"
              aria-label="Image précédente"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 px-2 py-2 text-white backdrop-blur hover:bg-black/55"
              onClick={() => go(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 px-2 py-2 text-white backdrop-blur hover:bg-black/55"
              onClick={() => go(1)}
            >
              ›
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {activeSlides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === Math.min(index, len - 1)
                      ? "bg-white"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
