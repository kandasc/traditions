import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { deleteProduct } from "./actions";
import { DeleteProductForm } from "./delete-product-form";
import { ProductEditorForm } from "./product-editor-form";

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

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-950">Éditer produit</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Images : téléversement ou URL, ordre avec ↑ ↓. Variantes : taille,
        nuancier + code hex, image optionnelle.
      </p>

      <ProductEditorForm
        productId={id}
        shopSlug={product.slug}
        initial={{
          name: product.name,
          slug: product.slug,
          priceXof: product.priceXof,
          isActive: product.isActive,
          featured: product.featured,
          description: product.description ?? "",
          details: product.details ?? "",
          images: product.images.map((im) => ({
            url: im.url,
            alt: im.alt,
          })),
          variants: product.variants.map((v) => ({
            sizeLabel: v.sizeLabel,
            colorHex: v.colorHex,
            imageUrl: v.imageUrl,
          })),
        }}
      />

      <DeleteProductForm deleteProductWithId={deleteProduct.bind(null, id)} />
    </div>
  );
}
