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
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { id: "asc" } },
        categories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
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
          categoryIds: product.categories.map((c) => c.id),
          categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            isActive: c.isActive,
          })),
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
            isPreorder: v.isPreorder,
          })),
        }}
      />

      <DeleteProductForm deleteProductWithId={deleteProduct.bind(null, id)} />
    </div>
  );
}
