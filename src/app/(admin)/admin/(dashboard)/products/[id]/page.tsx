import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import slugify from "slugify";

async function updateProduct(id: string, formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const priceXofRaw = String(formData.get("priceXof") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!name) throw new Error("Name is required");

  const slug =
    slugify(slugRaw || name, { lower: true, strict: true }) ||
    `produit-${id}`;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error("Not found");

  if (slug !== existing.slug) {
    const conflict = await prisma.product.findUnique({ where: { slug } });
    if (conflict) throw new Error("Slug already exists");
  }

  const priceXof = priceXofRaw ? Number(priceXofRaw) : null;

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      isActive,
      priceXof: Number.isFinite(priceXof as any) ? (priceXof as any) : null,
      description: description || null,
      details: details || null,
    },
  });

  redirect(`/admin/products/${id}`);
}

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-950">Éditer produit</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Images/variantes/cart/checkout seront ajoutés ensuite.
      </p>

      <form
        action={updateProduct.bind(null, id)}
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Nom
          </span>
          <input
            name="name"
            defaultValue={product.name}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Slug (URL)
          </span>
          <input
            name="slug"
            defaultValue={product.slug}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Prix (FCFA)
          </span>
          <input
            name="priceXof"
            defaultValue={product.priceXof ?? ""}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            inputMode="numeric"
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            name="isActive"
            defaultChecked={product.isActive}
            type="checkbox"
            className="h-4 w-4"
          />
          <span className="text-sm text-zinc-800">Actif</span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Description
          </span>
          <textarea
            name="description"
            defaultValue={product.description ?? ""}
            className="min-h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Détails
          </span>
          <textarea
            name="details"
            defaultValue={product.details ?? ""}
            className="min-h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
            type="submit"
          >
            Enregistrer
          </button>
          <a
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
            href={`/shop/${product.slug}`}
          >
            Voir sur le site
          </a>
        </div>
      </form>
    </div>
  );
}

