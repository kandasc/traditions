import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDeliveryZonesPage() {
  const zones = await prisma.deliveryZone.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-zinc-950">
            Zones de livraison
          </h1>
          <p className="text-sm text-zinc-600">
            Chaque zone définit les frais de livraison (FCFA) ajoutés au total
            commande en caisse.
          </p>
        </div>
        <Link
          href="/admin/delivery-zones/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Nouvelle zone
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-12 gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          <div className="col-span-4">Nom</div>
          <div className="col-span-2">Frais FCFA</div>
          <div className="col-span-2">Ordre</div>
          <div className="col-span-2">Actif</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {zones.length === 0 ? (
          <p className="px-4 py-8 text-sm text-zinc-600">
            Aucune zone. Créez-en au moins une pour activer le paiement en
            ligne.
          </p>
        ) : (
          zones.map((z) => (
            <div
              key={z.id}
              className="grid grid-cols-12 items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm text-zinc-800 last:border-0"
            >
              <div className="col-span-4">
                <div className="font-semibold text-zinc-950">{z.name}</div>
                <div className="text-xs text-zinc-500">{z.slug}</div>
              </div>
              <div className="col-span-2">{z.feeXof.toLocaleString("fr-FR")}</div>
              <div className="col-span-2">{z.sortOrder}</div>
              <div className="col-span-2">{z.isActive ? "Oui" : "Non"}</div>
              <div className="col-span-2 flex justify-end">
                <Link
                  className="text-sm font-semibold text-zinc-950 hover:underline"
                  href={`/admin/delivery-zones/${z.id}`}
                >
                  Éditer
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
