import Link from "next/link";
import { prisma } from "@/lib/db";
import { HeroPanelSlider } from "@/components/HeroPanelSlider";
import { SmartImage } from "@/components/SmartImage";

const HOMEPAGE_HERO_FALLBACK_IMAGE =
  "https://traditions-mode.com/public/images/accueil1.jpg";
const HERO_BG_KEY = "hero.backgroundImageUrl";

export default async function HomePage() {
  const [featured, anyProductImage, heroBg, heroSlides] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: [
        { featured: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      take: 8,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.productImage.findFirst({
      orderBy: { sortOrder: "asc" },
      select: { url: true },
    }),
    prisma.siteSetting.findUnique({ where: { key: HERO_BG_KEY } }),
    prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const heroBackgroundUrl =
    heroBg?.value?.trim() || HOMEPAGE_HERO_FALLBACK_IMAGE;

  const heroPanelFallback =
    featured[0]?.images?.[0]?.url ??
    anyProductImage?.url ??
    HOMEPAGE_HERO_FALLBACK_IMAGE;

  const sliderSlides = heroSlides.map((s) => ({
    id: s.id,
    imageUrl: s.imageUrl,
    alt: s.alt,
    href: s.href,
  }));

  return (
    <div className="flex flex-col gap-12">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroBackgroundUrl})`,
          }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative grid gap-6 p-8 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium uppercase tracking-widest text-zinc-200">
              Traditions
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Authenticité et traditions,
              <span className="block text-zinc-200">pensées pour le présent.</span>
            </h1>
            <p className="max-w-prose text-base leading-7 text-zinc-200">
              Une boutique pensée pour la découverte, la confiance et la fluidité —
              avec un back-office complet pour gérer produits, contenus et commandes.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
              >
                Découvrir le shop
              </Link>
              <Link
                href="/atelier"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
              >
                L’atelier sur mesure
              </Link>
            </div>
          </div>
          <HeroPanelSlider
            slides={sliderSlides}
            fallbackUrl={heroPanelFallback}
            fallbackAlt="Traditions"
          />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Sélection
            </h2>
            <p className="text-sm text-zinc-600">
              Les pièces disponibles actuellement.
            </p>
          </div>
          <Link className="text-sm font-semibold text-zinc-950" href="/shop">
            Voir tout →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-sm"
            >
              <div className="relative aspect-[4/5] w-full bg-zinc-50">
                {p.images[0]?.url ? (
                  <SmartImage
                    src={p.images[0].url}
                    alt={p.images[0].alt ?? p.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    proxyWidth={720}
                    proxyQuality={70}
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="text-sm font-semibold text-zinc-950">{p.name}</p>
                <p className="text-xs text-zinc-600">
                  {p.priceXof ? `${p.priceXof.toLocaleString("fr-FR")} FCFA` : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {featured.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Aucun produit en base pour le moment. Importez les données (seed) ou
            ajoutez des produits depuis l’admin.
          </p>
        ) : null}
      </section>
    </div>
  );
}

