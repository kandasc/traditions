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
    <div className="relative h-[min(62dvh,24rem)] w-full overflow-hidden rounded-2xl border border-white/15 bg-black/30 shadow-2xl sm:h-[min(58dvh,26rem)] md:h-[min(56dvh,28rem)] lg:h-[min(54dvh,30rem)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70 blur-xl scale-110"
        style={{ backgroundImage: `url(${posterSrc})` }}
        aria-hidden
      />
      <video
        className="absolute inset-0 h-full w-full object-contain"
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

