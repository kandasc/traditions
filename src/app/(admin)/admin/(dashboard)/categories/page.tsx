import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminCategoriesPage() {
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
        <Link
          href="/admin/categories/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Nouvelle catégorie
        </Link>
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

