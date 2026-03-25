import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PayNowButton } from "@/components/PayNowButton";
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

  const sizes = [
    ...new Set(product.variants.map((v) => v.sizeLabel).filter(Boolean)),
  ] as string[];
  const colorsMap = new Map<string, { hex: string; imageUrl?: string }>();
  for (const v of product.variants) {
    if (!v.colorHex) continue;
    if (!colorsMap.has(v.colorHex)) {
      colorsMap.set(v.colorHex, { hex: v.colorHex, imageUrl: v.imageUrl ?? undefined });
    }
  }
  const colors = [...colorsMap.values()];

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
          {product.images[0]?.url ? (
            <SmartImage
              src={product.images[0].url}
              alt={product.images[0].alt ?? product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              proxyWidth={1400}
              proxyQuality={74}
            />
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {product.images.slice(0, 8).map((img) => (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
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
        <Link className="text-sm font-semibold text-zinc-950" href="/shop">
          ← Retour au shop
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            {product.name}
          </h1>
          <div className="flex flex-col gap-1 text-sm text-zinc-700">
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

        {sizes.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
              Tailles
            </h2>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-950"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {colors.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
              Couleurs
            </h2>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <span
                  key={c.hex}
                  className="h-8 w-8 rounded-full border border-zinc-200"
                  style={{ backgroundColor: c.hex }}
                  title={c.hex}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <PayNowButton productId={product.id} />
          <p className="text-xs text-zinc-500">
            Le panier/checkout sera branché au gateway de paiement que vous
            fournirez (interface déjà prévue).
          </p>
        </div>

        {product.description ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
              Description
            </h2>
            <p className="text-sm leading-7 text-zinc-700">
              {product.description}
            </p>
          </div>
        ) : null}

        {product.details ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
              Détails
            </h2>
            <p className="text-sm leading-7 text-zinc-700">{product.details}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

