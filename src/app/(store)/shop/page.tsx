import Link from "next/link";
import { prisma } from "@/lib/db";
import { SmartImage } from "@/components/SmartImage";

function pickSingle(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function pickMany(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr
    .flatMap((x) => String(x ?? "").split(","))
    .map((x) => x.trim())
    .filter(Boolean);
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
  const categorySlugsRaw = pickMany(sp.category);
  const sizeRaw = pickMany(sp.size);
  const availableOnly = (pickSingle(sp.available) ?? "1").trim() !== "0";
  const q = (pickSingle(sp.q) ?? "").trim() || null;
  const min = parseBudget((pickSingle(sp.min) ?? "").trim() || null);
  const max = parseBudget((pickSingle(sp.max) ?? "").trim() || null);
  const minXof = min != null && max != null ? Math.min(min, max) : min;
  const maxXof = min != null && max != null ? Math.max(min, max) : max;

  const allowedCategorySlugs = ["icon", "heritage", "maison", "accessoires"] as const;
  const categorySlugs = [...new Set(categorySlugsRaw)]
    .filter((s) => allowedCategorySlugs.includes(s as any))
    .slice(0, 12);

  const sizes = [...new Set(sizeRaw.map((s) => s.trim().toUpperCase()))].slice(0, 12);
  const stockFilter = availableOnly
    ? {
        OR: [
          {
            variants: {
              some: {
                isActive: true,
                OR: [{ isPreorder: true }, { stock: null }, { stock: { gt: 0 } }],
              },
            },
          },
          // Products without variants stay visible as long as they are active.
          { variants: { none: { isActive: true } } },
        ],
      }
    : {};

  const productWhere = {
    isActive: true,
    ...(categorySlugs.length > 0
      ? { categories: { some: { slug: { in: categorySlugs }, isActive: true } } }
      : {}),
    ...(minXof != null || maxXof != null
      ? {
          priceXof: {
            ...(minXof != null ? { gte: minXof } : {}),
            ...(maxXof != null ? { lte: maxXof } : {}),
          },
        }
      : {}),
    AND: [
      ...(availableOnly ? [stockFilter] : []),
      ...(sizes.length
        ? [
            {
              variants: {
                some: {
                  isActive: true,
                  sizeLabel: { in: sizes },
                },
              },
            },
          ]
        : []),
      ...(q
        ? [
            {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
                { details: { contains: q, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };

  const [categories, sizeOptions, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, slug: { in: [...allowedCategorySlugs] } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, sizeLabel: { not: null } },
      distinct: ["sizeLabel"],
      select: { sizeLabel: true },
      orderBy: { sizeLabel: "asc" },
      take: 60,
    }),
    prisma.product.findMany({
      where: productWhere,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
  ]);

  const selectedCategories =
    categorySlugs.length > 0
      ? categories.filter((c) => categorySlugs.includes(c.slug))
      : [];
  const title =
    selectedCategories.length === 1 ? selectedCategories[0]!.name : "Shop";

  const sizeChoices = sizeOptions
    .map((o) => (o.sizeLabel ?? "").trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
          {title}
        </h1>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:grid-cols-12 sm:items-end"
        action="/shop"
        method="get"
      >
        <div className="sm:col-span-12 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Catégories
          </span>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap">
            {categories.map((c) => {
              const active = categorySlugs.includes(c.slug);
              return (
                <label
                  key={c.id}
                  className={`shrink-0 cursor-pointer select-none rounded-full border px-4 py-2 text-sm font-semibold ${
                    active
                      ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                      : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="category"
                    value={c.slug}
                    defaultChecked={active}
                    className="sr-only"
                  />
                  {c.name}
                </label>
              );
            })}
          </div>
        </div>
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
            Taille
          </span>
          <select
            name="size"
            defaultValue={sizes[0] ?? ""}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Toutes</option>
            {sizeChoices.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
          <label className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Disponibilité
            </span>
            <select
              name="available"
              defaultValue={availableOnly ? "1" : "0"}
              className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="1">Disponible</option>
              <option value="0">Tout afficher</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Filtrer
          </button>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Réinitialiser
          </Link>
        </div>
      </form>

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

