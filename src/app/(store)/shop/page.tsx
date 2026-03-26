import Link from "next/link";
import { prisma } from "@/lib/db";
import { SmartImage } from "@/components/SmartImage";

function pickSingle(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function parseBudget(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s/g, "").replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return clampInt(n, 0, 1_000_000_000);
}

function buildShopHref(params: Record<string, string | null | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    const t = String(v).trim();
    if (!t) continue;
    qs.set(k, t);
  }
  const s = qs.toString();
  return s ? `/shop?${s}` : "/shop";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const categorySlug = (pickSingle(sp.category) ?? "").trim() || null;
  const q = (pickSingle(sp.q) ?? "").trim() || null;
  const min = parseBudget((pickSingle(sp.min) ?? "").trim() || null);
  const max = parseBudget((pickSingle(sp.max) ?? "").trim() || null);
  const minXof = min != null && max != null ? Math.min(min, max) : min;
  const maxXof = min != null && max != null ? Math.max(min, max) : max;

  const productWhere = {
    isActive: true,
    ...(categorySlug ? { categories: { some: { slug: categorySlug } } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { details: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(minXof != null || maxXof != null
      ? {
          priceXof: {
            ...(minXof != null ? { gte: minXof } : {}),
            ...(maxXof != null ? { lte: maxXof } : {}),
          },
        }
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
  };

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: productWhere,
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

      <form
        className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:grid-cols-12 sm:items-end"
        action="/shop"
        method="get"
      >
        <input type="hidden" name="category" value={categorySlug ?? ""} />
        <label className="sm:col-span-6 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Recherche
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Ex: bogolan, robe, wax…"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="sm:col-span-3 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Budget min (FCFA)
          </span>
          <input
            name="min"
            defaultValue={minXof?.toString() ?? ""}
            inputMode="numeric"
            placeholder="0"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="sm:col-span-3 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Budget max (FCFA)
          </span>
          <input
            name="max"
            defaultValue={maxXof?.toString() ?? ""}
            inputMode="numeric"
            placeholder="200000"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <div className="sm:col-span-12 flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Filtrer
          </button>
          <Link
            href={buildShopHref({ category: categorySlug })}
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Réinitialiser
          </Link>
        </div>
      </form>

      {categories.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap">
          <Link
            href={buildShopHref({ q, min: minXof?.toString(), max: maxXof?.toString() })}
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
                href={buildShopHref({
                  category: c.slug,
                  q,
                  min: minXof?.toString(),
                  max: maxXof?.toString(),
                })}
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
          Aucun article ne correspond à ces filtres.
        </p>
      ) : null}
    </div>
  );
}

