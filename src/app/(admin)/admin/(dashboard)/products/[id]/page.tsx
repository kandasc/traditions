import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { deleteProduct, updateProduct } from "./actions";
import { DeleteProductForm } from "./delete-product-form";

function serializeVariants(
  variants: {
    sizeLabel: string | null;
    colorHex: string | null;
    imageUrl: string | null;
  }[],
) {
  return variants
    .map((v) =>
      [v.sizeLabel ?? "", v.colorHex ?? "", v.imageUrl ?? ""].join(" | "),
    )
    .join("\n");
}

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { id: "asc" } },
    },
  });
  if (!product) return notFound();

  const imageLines = product.images
    .map((im) => (im.alt ? `${im.url}\t${im.alt}` : im.url))
    .join("\n");

  const variantLines = serializeVariants(product.variants);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-950">Éditer produit</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Images: une URL par ligne (optionnel: tab puis texte alternatif).
        Variantes:{" "}
        <span className="font-mono text-xs">taille | #couleur | url_image</span>{" "}
        par ligne.
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
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
          <label className="flex items-center gap-3">
            <input
              name="isActive"
              defaultChecked={product.isActive}
              type="checkbox"
              className="h-4 w-4"
            />
            <span className="text-sm text-zinc-800">
              Actif (visible sur le site)
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              name="featured"
              defaultChecked={product.featured}
              type="checkbox"
              className="h-4 w-4"
            />
            <span className="text-sm text-zinc-800">Mis en avant (accueil)</span>
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Images (URLs)
          </span>
          <textarea
            name="imageUrls"
            defaultValue={imageLines}
            placeholder={
              "https://…\nhttps://…\n(alt: URL puis tab puis texte)"
            }
            className="min-h-32 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-zinc-400"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Variantes
          </span>
          <textarea
            name="variants"
            defaultValue={variantLines}
            placeholder={
              "SMALL | #f5ec00 | https://…\nM | #ff0000 |\n | #00ff00 |"
            }
            className="min-h-32 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-zinc-400"
          />
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

      <DeleteProductForm deleteProductWithId={deleteProduct.bind(null, id)} />
    </div>
  );
}
