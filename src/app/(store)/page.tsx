import Link from "next/link";
import { prisma } from "@/lib/db";
import { HeroPanelSlider } from "@/components/HeroPanelSlider";
import { SmartImage } from "@/components/SmartImage";

const HOMEPAGE_HERO_FALLBACK_IMAGE = "/hero-background.png";
const HERO_BG_KEY = "hero.backgroundImageUrl";

export default async function HomePage() {
  const [categories, featured, anyProductImage, heroBg, heroSlides] =
    await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 12,
      include: { products: { where: { isActive: true }, take: 1, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
    }),
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
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 sm:rounded-3xl dark:border-zinc-700">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroBackgroundUrl})`,
          }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium uppercase tracking-widest text-zinc-200">
              Traditions
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
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
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-zinc-950 hover:bg-zinc-100 sm:text-sm"
              >
                Découvrir le shop
              </Link>
              <Link
                href="/atelier"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur hover:bg-white/15 sm:text-sm"
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
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Catégories
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Explorez la boutique par univers.
            </p>
          </div>
          <Link
            className="min-h-11 shrink-0 text-sm font-semibold text-zinc-950 dark:text-zinc-50"
            href="/shop"
          >
            Voir tout →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {categories.map((c) => {
            const img = c.products[0]?.images?.[0];
            return (
            <Link
              key={c.id}
              href={`/shop?category=${encodeURIComponent(c.slug)}`}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <div className="relative aspect-[4/5] w-full bg-zinc-50">
                {img?.url ? (
                  <SmartImage
                    src={img.url}
                    alt={img.alt ?? c.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    proxyWidth={720}
                    proxyQuality={70}
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-1 p-3 sm:p-4">
                <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 sm:text-sm">
                  {c.name}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Voir les articles →
                </p>
              </div>
            </Link>
          );
          })}
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Aucune catégorie active pour le moment. Ajoutez-en depuis l’admin.
          </p>
        ) : null}
      </section>
    </div>
  );
}

