"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { proxiedImageUrl } from "@/components/SmartImage";

type Props = {
  src: string;
  alt: string;
  /** CSS scale factor while pointer is over the image (desktop / fine pointer). */
  zoom?: number;
  sizes?: string;
  priority?: boolean;
  proxyWidth?: number;
  proxyQuality?: number;
  className?: string;
};

export function ProductImageMagnifier({
  src,
  alt,
  zoom = 2.25,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  priority = false,
  proxyWidth = 2000,
  proxyQuality = 78,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [finePointer, setFinePointer] = useState(true);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const apply = () => setFinePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const setOriginFromEvent = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setOrigin({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    });
  }, []);

  const isRemote = useMemo(() => /^https?:\/\//i.test(src), [src]);
  const proxiedSrc = useMemo(
    () => proxiedImageUrl(src, proxyWidth, proxyQuality),
    [src, proxyWidth, proxyQuality],
  );

  const zoomActive = hover && finePointer && !reduceMotion;

  return (
    <div
      ref={rootRef}
      className={[
        "relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900",
        finePointer && !reduceMotion ? "cursor-zoom-in" : "",
        className ?? "",
      ].join(" ")}
      onMouseEnter={(e) => {
        setHover(true);
        setOriginFromEvent(e);
      }}
      onMouseLeave={() => setHover(false)}
      onMouseMove={setOriginFromEvent}
      role="group"
      aria-label={`${alt} — sur l’ordinateur, survolez l’image pour zoomer les détails.`}
    >
      <Image
        src={proxiedSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover select-none"
        unoptimized={isRemote}
        style={{
          transform: zoomActive ? `scale(${zoom})` : "scale(1)",
          transformOrigin: `${origin.x}px ${origin.y}px`,
          transition: zoomActive ? "none" : "transform 0.22s ease-out",
        }}
      />
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduceMotion;
}
