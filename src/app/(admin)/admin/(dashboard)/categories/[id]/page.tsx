import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import slugify from "slugify";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return notFound();

  async function updateCategory(formData: FormData) {
    "use server";

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new Error("Catégorie introuvable");

    const name = String(formData.get("name") ?? "").trim();
    const slugRaw = String(formData.get("slug") ?? "").trim();
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const sortRaw = String(formData.get("sortOrder") ?? "").trim();
    const isActive = formData.get("isActive") === "on";
    const sortOrder = sortRaw ? Number(sortRaw) : 0;

    if (!name) throw new Error("Nom requis");

    let slug =
      slugRaw ||
      slugify(name, { lower: true, strict: true }) ||
      existing.slug;
    const clash = await prisma.category.findFirst({
      where: { slug, NOT: { id } },
    });
    if (clash) {
      const base = slug;
      let s = `${base}-2`;
      let n = 3;
      while (
        await prisma.category.findFirst({ where: { slug: s, NOT: { id } } })
      ) {
        s = `${base}-${n++}`;
      }
      slug = s;
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        imageUrl: imageUrl || null,
        sortOrder: Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0,
        isActive,
      },
    });

    redirect("/admin/categories");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-950">Éditer catégorie</h1>
      <p className="mt-1 text-xs font-mono text-zinc-500">{category.id}</p>

      <form action={updateCategory} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Nom affiché
          </span>
          <input
            name="name"
            required
            defaultValue={category.name}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Slug (URL interne, unique)
          </span>
          <input
            name="slug"
            defaultValue={category.slug}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="Laisser vide pour régénérer depuis le nom"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Image mise en avant (URL)
          </span>
          <input
            name="imageUrl"
            defaultValue={category.imageUrl ?? ""}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="https://… ou /image.png"
          />
          <p className="text-xs text-zinc-500">
            Si vide, on utilise une image d’article de la catégorie (si disponible).
          </p>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Ordre d’affichage
          </span>
          <input
            name="sortOrder"
            defaultValue={category.sortOrder}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            inputMode="numeric"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={category.isActive}
            className="h-4 w-4"
          />
          Catégorie active (visible aux clients)
        </label>

        <button
          className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
          type="submit"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}

