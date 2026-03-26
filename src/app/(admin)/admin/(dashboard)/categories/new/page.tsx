import { prisma } from "@/lib/db";
import slugify from "slugify";
import { redirect } from "next/navigation";

async function createCategory(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const sortRaw = String(formData.get("sortOrder") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  const sortOrder = sortRaw ? Number(sortRaw) : 0;
  if (!name) throw new Error("Nom requis");

  const baseSlug =
    slugify(name, { lower: true, strict: true }) || "categorie";
  let slug = baseSlug;
  let i = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      sortOrder: Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0,
      isActive,
    },
  });

  redirect(`/admin/categories/${category.id}`);
}

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-950">
        Nouvelle catégorie
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Une catégorie sert à filtrer la boutique et à structurer l’accueil.
      </p>

      <form action={createCategory} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Nom affiché
          </span>
          <input
            name="name"
            required
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="Ex: Robes"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Ordre d’affichage
          </span>
          <input
            name="sortOrder"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="0"
            inputMode="numeric"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked
            className="h-4 w-4"
          />
          Catégorie active (visible aux clients)
        </label>

        <button
          className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
          type="submit"
        >
          Créer
        </button>
      </form>
    </div>
  );
}

