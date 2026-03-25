"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type Props = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackClassName?: string;
  proxyWidth?: number;
  proxyQuality?: number;
};

export function proxiedImageUrl(
  src: string,
  proxyWidth = 900,
  proxyQuality = 72,
): string {
  const isRemote = /^https?:\/\//i.test(src);
  if (!isRemote) return src;
  return `/api/image?url=${encodeURIComponent(src)}&w=${encodeURIComponent(
    String(proxyWidth),
  )}&q=${encodeURIComponent(String(proxyQuality))}`;
}

/**
 * For large remote images, Next's optimizer can be slow in dev.
 * We bypass optimization in development to avoid "blank cards".
 */
export function SmartImage({
  src,
  alt,
  className,
  fallbackClassName,
  proxyWidth,
  proxyQuality,
  ...props
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={[
          "h-full w-full bg-zinc-100",
          fallbackClassName ?? "",
        ].join(" ")}
        aria-label={alt}
      />
    );
  }

  const isRemote = /^https?:\/\//i.test(src);
  const proxiedSrc = isRemote
    ? proxiedImageUrl(src, proxyWidth ?? 900, proxyQuality ?? 72)
    : src;

  return (
    <Image
      {...props}
      src={proxiedSrc}
      alt={alt}
      className={className}
      // We handle optimization ourselves for remote images via /api/image.
      unoptimized={isRemote}
      onError={() => setFailed(true)}
    />
  );
}

