import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AddToCartSection } from "@/components/AddToCartSection";
import { ProductImageMagnifier } from "@/components/ProductImageMagnifier";
import { SmartImage } from "@/components/SmartImage";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true } },
    },
  });

  if (!product || !product.isActive) return notFound();

  const inStockVariants = product.variants.filter(
    (v) => v.stock == null || v.stock > 0,
  );

  // If a product has variants but all are out of stock, do not show it as available.
  if (product.variants.length > 0 && inStockVariants.length === 0) {
    return notFound();
  }

  const variantOptions = inStockVariants.map((v) => ({
    id: v.id,
    sizeLabel: v.sizeLabel,
    colorHex: v.colorHex,
    stock: v.stock,
  }));

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        {product.images[0]?.url ? (
          <ProductImageMagnifier
            src={product.images[0].url}
            alt={product.images[0].alt ?? product.name}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            proxyWidth={2000}
            proxyQuality={78}
          />
        ) : (
          <div className="aspect-[4/5] w-full rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900" />
        )}
        <div className="grid grid-cols-4 gap-3">
          {product.images.slice(0, 8).map((img) => (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <SmartImage
                src={img.url}
                alt={img.alt ?? product.name}
                fill
                className="object-cover"
                sizes="25vw"
                proxyWidth={360}
                proxyQuality={68}
              />
            </div>
          ))}
        </div>
        <Link
          className="text-sm font-semibold text-zinc-950 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-700 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:text-white"
          href="/shop"
        >
          ← Retour au shop
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {product.name}
          </h1>
          <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            {product.priceXof ? (
              <p>{product.priceXof.toLocaleString("fr-FR")} FCFA</p>
            ) : null}
            {product.priceEurCents ? (
              <p>{(product.priceEurCents / 100).toFixed(0)} €</p>
            ) : null}
            {product.priceUsdCents ? (
              <p>{(product.priceUsdCents / 100).toFixed(0)} $</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {product.priceXof ? (
            <AddToCartSection productId={product.id} variants={variantOptions} />
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Prix sur demande.
            </p>
          )}
        </div>

        {product.description ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Description
            </h2>
            <p className="text-sm leading-7 text-zinc-800 dark:text-zinc-200">
              {product.description}
            </p>
          </div>
        ) : null}

        {product.details ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Détails
            </h2>
            <p className="text-sm leading-7 text-zinc-800 dark:text-zinc-200">
              {product.details}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
