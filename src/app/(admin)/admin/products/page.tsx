import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-zinc-950">Produits</h1>
          <p className="text-sm text-zinc-600">
            Liste (édition rapide à venir: prix, stock, variantes, images).
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Nouveau produit
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-12 gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          <div className="col-span-6">Nom</div>
          <div className="col-span-2">Actif</div>
          <div className="col-span-2">Prix XOF</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {products.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm text-zinc-800"
          >
            <div className="col-span-6">
              <div className="font-semibold text-zinc-950">{p.name}</div>
              <div className="text-xs text-zinc-500">/{p.slug}</div>
            </div>
            <div className="col-span-2">
              {p.isActive ? "Oui" : "Non"}
            </div>
            <div className="col-span-2">
              {p.priceXof ? p.priceXof.toLocaleString("fr-FR") : "—"}
            </div>
            <div className="col-span-2 flex justify-end gap-3">
              <Link
                className="text-sm font-semibold text-zinc-950 hover:underline"
                href={`/admin/products/${p.id}`}
              >
                Éditer
              </Link>
              <Link
                className="text-sm font-semibold text-zinc-700 hover:underline"
                href={`/shop/${p.slug}`}
              >
                Voir
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

