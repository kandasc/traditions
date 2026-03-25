import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import slugify from "slugify";

export default async function EditDeliveryZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zone = await prisma.deliveryZone.findUnique({ where: { id } });
  if (!zone) return notFound();

  async function updateZone(formData: FormData) {
    "use server";

    const existing = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!existing) throw new Error("Zone introuvable");

    const name = String(formData.get("name") ?? "").trim();
    const slugRaw = String(formData.get("slug") ?? "").trim();
    const feeRaw = String(formData.get("feeXof") ?? "").trim();
    const sortRaw = String(formData.get("sortOrder") ?? "").trim();
    const isActive = formData.get("isActive") === "on";

    const feeXof = Number(feeRaw);
    const sortOrder = sortRaw ? Number(sortRaw) : 0;

    if (!name) throw new Error("Nom requis");
    if (!Number.isFinite(feeXof) || feeXof < 0) {
      throw new Error("Frais invalides");
    }

    let slug =
      slugRaw ||
      slugify(name, { lower: true, strict: true }) ||
      existing.slug;
    const clash = await prisma.deliveryZone.findFirst({
      where: { slug, NOT: { id } },
    });
    if (clash) {
      const base = slug;
      let s = `${base}-2`;
      let n = 3;
      while (await prisma.deliveryZone.findFirst({ where: { slug: s, NOT: { id } } })) {
        s = `${base}-${n++}`;
      }
      slug = s;
    }

    await prisma.deliveryZone.update({
      where: { id },
      data: {
        name,
        slug,
        feeXof: Math.round(feeXof),
        sortOrder: Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0,
        isActive,
      },
    });

    redirect("/admin/delivery-zones");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-950">Éditer la zone</h1>
      <p className="mt-1 text-xs font-mono text-zinc-500">{zone.id}</p>

      <form action={updateZone} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Nom affiché
          </span>
          <input
            name="name"
            required
            defaultValue={zone.name}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Slug (URL interne, unique)
          </span>
          <input
            name="slug"
            defaultValue={zone.slug}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            placeholder="Laisser vide pour régénérer depuis le nom"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Frais de livraison (FCFA)
          </span>
          <input
            name="feeXof"
            required
            defaultValue={zone.feeXof}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            inputMode="numeric"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Ordre d’affichage
          </span>
          <input
            name="sortOrder"
            defaultValue={zone.sortOrder}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            inputMode="numeric"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={zone.isActive}
            className="h-4 w-4"
          />
          Zone active (visible en boutique)
        </label>

        <button
          className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
          type="submit"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
