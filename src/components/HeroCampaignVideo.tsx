export function HeroCampaignVideo({
  mp4Src = "/campaign/TRADITIONS_1.720p.fast.mp4",
  webmSrc = "/campaign/TRADITIONS_1.720p.fast.webm",
  posterSrc = "/campaign/TRADITIONS_1.poster.jpg",
}: {
  mp4Src?: string;
  webmSrc?: string;
  posterSrc?: string;
}) {
  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/15 bg-black/30 shadow-2xl">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        loop
        autoPlay
        preload="metadata"
        poster={posterSrc}
      >
        <source src={webmSrc} type="video/webm" />
        <source src={mp4Src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
    </div>
  );
}

