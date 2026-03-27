import Link from "next/link";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

export default async function AdminCategoriesPage() {
  async function autoCategorize() {
    "use server";

    const defaults = [
      { name: "ICON", slug: "icon", sortOrder: 10 },
      { name: "HÉRITAGE", slug: "heritage", sortOrder: 20 },
      { name: "MAISON", slug: "maison", sortOrder: 30 },
      { name: "ACCESSOIRES", slug: "accessoires", sortOrder: 40 },
    ];

    for (const c of defaults) {
      await prisma.category.upsert({
        where: { slug: c.slug },
        create: { ...c, isActive: true },
        update: { name: c.name, sortOrder: c.sortOrder, isActive: true },
      });
    }

    // (Optional) keep inferred categories disabled: user asked for a specific list only.

    const categories = await prisma.category.findMany({
      select: { id: true, slug: true },
    });
    const bySlug = new Map(categories.map((c) => [c.slug, c.id] as const));

    // Assign categories only to products that currently have none.
    const uncategorizedFull = await prisma.product.findMany({
      where: { categories: { none: {} } },
      select: { id: true, name: true, description: true, details: true },
      take: 800,
    });
    for (const p of uncategorizedFull) {
      const blob = `${p.name}\n${p.description ?? ""}\n${p.details ?? ""}`.toLowerCase();
      const slugs: string[] = [];
      if (blob.includes("bogolan") || blob.includes("wax") || blob.includes("indigo"))
        slugs.push("heritage");
      if (/\bkimono\b/.test(blob) || /\brobe(s)?\b/.test(blob) || /\bkaftan(s)?\b/.test(blob) || /\bcaftan(s)?\b/.test(blob))
        slugs.push("icon");
      if (blob.includes("parfum") || blob.includes("bougie") || blob.includes("maison"))
        slugs.push("maison");
      if (blob.includes("sac") || blob.includes("ceinture") || blob.includes("accessoire"))
        slugs.push("accessoires");

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

    // Pick a featured picture per category (if missing) from one of its products.
    const catsToFill = await prisma.category.findMany({
      where: { isActive: true, imageUrl: null },
      select: { id: true },
      take: 100,
    });
    for (const c of catsToFill) {
      const prod = await prisma.product.findFirst({
        where: { isActive: true, categories: { some: { id: c.id } } },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });
      const url = prod?.images?.[0]?.url ?? null;
      if (url) {
        await prisma.category.update({
          where: { id: c.id },
          data: { imageUrl: url },
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/categories");
    redirect("/admin/categories");
  }

  async function deleteCategory(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return;
    await prisma.category.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/categories");
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
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="text-sm font-semibold text-red-700 hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

