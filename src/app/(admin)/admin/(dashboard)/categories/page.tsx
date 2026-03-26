import Link from "next/link";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import slugify from "slugify";

export default async function AdminCategoriesPage() {
  async function autoCategorize() {
    "use server";

    const defaults = [
      { name: "Robes", slug: "robes", sortOrder: 10 },
      { name: "Ensembles", slug: "ensembles", sortOrder: 20 },
      { name: "Boubous", slug: "boubous", sortOrder: 30 },
      { name: "Tops", slug: "tops", sortOrder: 40 },
      { name: "Pantalons", slug: "pantalons", sortOrder: 50 },
      { name: "Jupes", slug: "jupes", sortOrder: 60 },
      { name: "Accessoires", slug: "accessoires", sortOrder: 70 },
    ];

    for (const c of defaults) {
      await prisma.category.upsert({
        where: { slug: c.slug },
        create: { ...c, isActive: true },
        update: { name: c.name, sortOrder: c.sortOrder },
      });
    }

    // Also create a few categories inferred from existing products (best-effort).
    const products = await prisma.product.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 400,
    });
    const inferred: string[] = [];
    for (const p of products) {
      const n = p.name.toLowerCase();
      if (n.includes("kimono")) inferred.push("Kimonos");
      if (n.includes("abaya")) inferred.push("Abayas");
      if (n.includes("caftan") || n.includes("kaftan")) inferred.push("Caftans");
      if (n.includes("homme")) inferred.push("Homme");
      if (n.includes("enfant")) inferred.push("Enfant");
    }
    for (const name of [...new Set(inferred)].slice(0, 12)) {
      const base = slugify(name, { lower: true, strict: true }) || "categorie";
      let slug = base;
      let i = 2;
      while (await prisma.category.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
      }
      await prisma.category.create({
        data: { name, slug, isActive: true, sortOrder: 200 },
      });
    }

    const categories = await prisma.category.findMany({
      select: { id: true, slug: true },
    });
    const bySlug = new Map(categories.map((c) => [c.slug, c.id] as const));

    // Assign categories only to products that currently have none.
    const uncategorized = await prisma.product.findMany({
      where: { categories: { none: {} } },
      select: { id: true, name: true },
      take: 800,
    });
    for (const p of uncategorized) {
      const n = p.name.toLowerCase();
      const slugs: string[] = [];
      if (/\brobe(s)?\b/.test(n)) slugs.push("robes");
      if (/\bensemble(s)?\b/.test(n)) slugs.push("ensembles");
      if (/\bboubou(x|s)?\b/.test(n)) slugs.push("boubous");
      if (/\bchemise(s)?\b/.test(n) || /\btop(s)?\b/.test(n)) slugs.push("tops");
      if (/\bpantalon(s)?\b/.test(n)) slugs.push("pantalons");
      if (/\bjupe(s)?\b/.test(n)) slugs.push("jupes");
      if (/\baccessoire(s)?\b/.test(n)) slugs.push("accessoires");
      if (n.includes("kimono")) slugs.push("kimonos");
      if (n.includes("abaya")) slugs.push("abayas");
      if (n.includes("caftan") || n.includes("kaftan")) slugs.push("caftans");
      if (n.includes("homme")) slugs.push("homme");
      if (n.includes("enfant")) slugs.push("enfant");

      const ids = [...new Set(slugs)]
        .map((s) => bySlug.get(s))
        .filter((x): x is string => typeof x === "string");
      if (ids.length > 0) {
        await prisma.product.update({
          where: { id: p.id },
          data: { categories: { set: ids.map((id) => ({ id })) } },
        });
      }
    }

    redirect("/admin/categories");
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-zinc-950">Catégories</h1>
          <p className="text-sm text-zinc-600">
            Les clients les voient sur l’accueil. Cliquer ouvre la boutique
            filtrée sur la catégorie.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action={autoCategorize}>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
            >
              Auto-catégoriser les articles
            </button>
          </form>
          <Link
            href="/admin/categories/new"
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Nouvelle catégorie
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-12 gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          <div className="col-span-5">Nom</div>
          <div className="col-span-2">Produits</div>
          <div className="col-span-2">Ordre</div>
          <div className="col-span-1">Actif</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {categories.length === 0 ? (
          <p className="px-4 py-8 text-sm text-zinc-600">
            Aucune catégorie. Créez-en pour organiser la boutique.
          </p>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-12 items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm text-zinc-800 last:border-0"
            >
              <div className="col-span-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-950">{c.name}</div>
                    <div className="truncate text-xs text-zinc-500">{c.slug}</div>
                  </div>
                </div>
              </div>
              <div className="col-span-2">{c._count.products}</div>
              <div className="col-span-2">{c.sortOrder}</div>
              <div className="col-span-1">{c.isActive ? "Oui" : "Non"}</div>
              <div className="col-span-2 flex justify-end gap-4">
                <Link
                  className="text-sm font-semibold text-zinc-950 hover:underline"
                  href={`/admin/categories/${c.id}`}
                >
                  Éditer
                </Link>
                <Link
                  className="text-sm font-semibold text-zinc-700 hover:underline"
                  href={`/shop?category=${encodeURIComponent(c.slug)}`}
                >
                  Voir
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

