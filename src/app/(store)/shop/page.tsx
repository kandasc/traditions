import Link from "next/link";
import { prisma } from "@/lib/db";
import { SmartImage } from "@/components/SmartImage";

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        {
          variants: {
            some: {
              isActive: true,
              OR: [{ stock: null }, { stock: { gt: 0 } }],
            },
          },
        },
        // Products without variants stay visible as long as they are active.
        { variants: { none: { isActive: true } } },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Shop
        </h1>
        <p className="max-w-prose text-sm leading-6 text-zinc-600">
          Découvrez nos pièces. Filtrage, collections et stock seront gérés depuis
          l’admin.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.slug}`}
            className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-sm"
          >
            <div className="relative aspect-[4/5] w-full bg-zinc-50">
              {p.images[0]?.url ? (
                <SmartImage
                  src={p.images[0].url}
                  alt={p.images[0].alt ?? p.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  proxyWidth={720}
                  proxyQuality={70}
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-1 p-4">
              <p className="text-sm font-semibold text-zinc-950">{p.name}</p>
              <p className="text-xs text-zinc-600">
                {p.priceXof ? `${p.priceXof.toLocaleString("fr-FR")} FCFA` : "—"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

