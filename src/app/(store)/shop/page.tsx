import Link from "next/link";
import { prisma } from "@/lib/db";
import { SmartImage } from "@/components/SmartImage";

function pickSingle(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const categorySlug = (pickSingle(sp.category) ?? "").trim() || null;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug
          ? { categories: { some: { slug: categorySlug } } }
          : {}),
        OR: [
          {
            variants: {
              some: {
                isActive: true,
                OR: [{ stock: null }, { stock: { gt: 0 } }],
              },
            },
          },
          // Products without variants stay visible as long as they are active.
          { variants: { none: { isActive: true } } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
  ]);

  const selectedCategory =
    categorySlug != null
      ? categories.find((c) => c.slug === categorySlug) ?? null
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
          {selectedCategory ? selectedCategory.name : "Shop"}
        </h1>
        <p className="max-w-prose text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {selectedCategory
            ? "Articles filtrés par catégorie."
            : "Découvrez nos pièces. Filtrez par catégorie."}
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap">
          <Link
            href="/shop"
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
              !selectedCategory
                ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            Tout
          </Link>
          {categories.map((c) => {
            const active = selectedCategory?.id === c.id;
            return (
              <Link
                key={c.id}
                href={`/shop?category=${encodeURIComponent(c.slug)}`}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                  active
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                    : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.slug}`}
            className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
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

      {products.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aucun article pour cette catégorie.
        </p>
      ) : null}
    </div>
  );
}

