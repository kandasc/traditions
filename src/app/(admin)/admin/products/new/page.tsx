import { prisma } from "@/lib/db";
import slugify from "slugify";
import { redirect } from "next/navigation";

async function createProduct(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const priceXofRaw = String(formData.get("priceXof") ?? "").trim();

  const priceXof = priceXofRaw ? Number(priceXofRaw) : undefined;
  if (!name) throw new Error("Name is required");

  const baseSlug = slugify(name, { lower: true, strict: true }) || "produit";
  let slug = baseSlug;
  let i = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      isActive: true,
      priceXof: Number.isFinite(priceXof) ? priceXof : null,
    },
  });

  redirect(`/admin/products/${product.id}`);
}

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-950">Nouveau produit</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Créez un produit, puis ajoutez images, variantes, description, etc.
      </p>

      <form action={createProduct} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Nom
          </span>
          <input
            name="name"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="Ex: Deija"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Prix (FCFA)
          </span>
          <input
            name="priceXof"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="75000"
            inputMode="numeric"
          />
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

