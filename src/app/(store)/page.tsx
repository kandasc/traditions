import Link from "next/link";
import { prisma } from "@/lib/db";
import { SmartImage } from "@/components/SmartImage";
import { HeroCampaignVideo } from "@/components/HeroCampaignVideo";

const HOMEPAGE_HERO_FALLBACK_IMAGE = "/hero-background.png";
const HERO_BG_KEY = "hero.backgroundImageUrl";

export default async function HomePage() {
  const [anyProductImage, heroBg, heroSlides, nouveautés, bestSellerRows] =
    await Promise.all([
      prisma.productImage.findFirst({
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      }),
      prisma.siteSetting.findUnique({ where: { key: HERO_BG_KEY } }),
      prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ createdAt: "desc" }],
        take: 8,
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: { not: null },
          order: { status: "PAID" },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 8,
      }),
    ]);

  const bestSellerIds = bestSellerRows
    .map((r) => r.productId)
    .filter((x): x is string => typeof x === "string");

  const bestSellerProducts = bestSellerIds.length
    ? await prisma.product.findMany({
        where: { id: { in: bestSellerIds }, isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      })
    : [];

  const bestSellers = bestSellerIds
    .map((id) => bestSellerProducts.find((p) => p.id === id))
    .filter((p): p is (typeof bestSellerProducts)[number] => Boolean(p));

  const heroBackgroundUrl =
    heroBg?.value?.trim() || HOMEPAGE_HERO_FALLBACK_IMAGE;

  const heroPanelFallback =
    nouveautés[0]?.images?.[0]?.url ??
    anyProductImage?.url ??
    HOMEPAGE_HERO_FALLBACK_IMAGE;

  const univers = [
    {
      title: "ICON",
      desc: "Des pièces fortes, pensées pour marquer les esprits, facile à porter au quotidien",
      href: "/shop?category=icon",
    },
    {
      title: "HÉRITAGE",
      desc: "L’âme de nos cultures, racontée à travers les matières",
      href: "/shop?category=heritage",
    },
    {
      title: "L’ATELIER",
      desc: "Le sur-mesure comme expérience",
      href: "/atelier",
    },
    {
      title: "MAISON",
      desc: "Une signature olfactive et lifestyle",
      href: "/shop?category=maison",
    },
    {
      title: "ACCESSOIRES",
      desc: "Les détails qui complètent une allure",
      href: "/shop?category=accessoires",
    },
  ];

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
              Une maison de mode{" "}
              <span className="block text-zinc-200">
                entre héritage et modernité
              </span>
            </h1>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-zinc-950 hover:bg-zinc-100 sm:text-sm"
              >
                Découvrir la collection
              </Link>
              <Link
                href="/maison"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur hover:bg-white/15 sm:text-sm"
              >
                Découvrir la maison
              </Link>
            </div>
          </div>
          <HeroCampaignVideo />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Nos univers
            </h2>
          </div>
          <Link
            className="min-h-11 shrink-0 text-sm font-semibold text-zinc-950 dark:text-zinc-50"
            href="/shop"
          >
            Voir la collection →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {univers.map((u) => (
            <Link
              key={u.title}
              href={u.href}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {u.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                {u.desc}
              </p>
              <p className="mt-4 text-sm font-semibold text-zinc-950 group-hover:underline dark:text-zinc-50">
                Explorer →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Nouveautés
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Les pièces les plus récentes.
            </p>
          </div>
          <Link
            className="min-h-11 shrink-0 text-sm font-semibold text-zinc-950 dark:text-zinc-50"
            href="/shop"
          >
            Voir le shop →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {nouveautés.slice(0, 8).map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <div className="relative aspect-[4/5] w-full bg-zinc-50 dark:bg-zinc-900">
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
              <div className="flex flex-col gap-1 p-3 sm:p-4">
                <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 sm:text-sm">
                  {p.name}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {p.priceXof ? `${p.priceXof.toLocaleString("fr-FR")} FCFA` : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Best sellers
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Les pièces les plus populaires.
            </p>
          </div>
          <Link
            className="min-h-11 shrink-0 text-sm font-semibold text-zinc-950 dark:text-zinc-50"
            href="/shop"
          >
            Voir le shop →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {(bestSellers.length ? bestSellers : nouveautés).slice(0, 8).map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <div className="relative aspect-[4/5] w-full bg-zinc-50 dark:bg-zinc-900">
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
              <div className="flex flex-col gap-1 p-3 sm:p-4">
                <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 sm:text-sm">
                  {p.name}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {p.priceXof ? `${p.priceXof.toLocaleString("fr-FR")} FCFA` : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Story
          </h2>
          <div className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            <p>Traditions est une histoire de transmission.</p>
            <p className="mt-3">
              Fondée au début des années 2000 par Mariatou Mariette Dicko, la
              marque puise son essence dans la richesse des étoffes africaines.
            </p>
            <p className="mt-3">
              En 2023, sa fille Renée Mariame reprend le flambeau et donne une
              nouvelle dimension à la marque.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Découvrir la maison
        </h2>
        <Link
          href="/maison"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-7 text-base font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          → Découvrir la maison
        </Link>
      </section>
    </div>
  );
}

