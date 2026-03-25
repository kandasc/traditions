import { prisma } from "@/lib/db";
import slugify from "slugify";
import { redirect } from "next/navigation";

async function createZone(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const feeRaw = String(formData.get("feeXof") ?? "").trim();
  const sortRaw = String(formData.get("sortOrder") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  const feeXof = Number(feeRaw);
  const sortOrder = sortRaw ? Number(sortRaw) : 0;

  if (!name) throw new Error("Nom requis");
  if (!Number.isFinite(feeXof) || feeXof < 0) {
    throw new Error("Frais invalides");
  }

  const baseSlug = slugify(name, { lower: true, strict: true }) || "zone";
  let slug = baseSlug;
  let i = 2;
  while (await prisma.deliveryZone.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const zone = await prisma.deliveryZone.create({
    data: {
      name,
      slug,
      feeXof: Math.round(feeXof),
      sortOrder: Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0,
      isActive,
    },
  });

  redirect(`/admin/delivery-zones/${zone.id}`);
}

export default function NewDeliveryZonePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-950">Nouvelle zone</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Le libellé et les frais s’affichent sur la page de commande. Vous
        pouvez désactiver une zone sans la supprimer.
      </p>

      <form action={createZone} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Nom affiché
          </span>
          <input
            name="name"
            required
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="Ex: Abidjan — Cocody"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Frais de livraison (FCFA)
          </span>
          <input
            name="feeXof"
            required
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="2000"
            inputMode="numeric"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Ordre d’affichage
          </span>
          <input
            name="sortOrder"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="0"
            inputMode="numeric"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
          Zone active (visible en boutique)
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
