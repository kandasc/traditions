import Link from "next/link";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const BG_KEY = "hero.backgroundImageUrl";

async function saveBackground(formData: FormData) {
  "use server";
  const url = String(formData.get("backgroundUrl") ?? "").trim();
  await prisma.siteSetting.upsert({
    where: { key: BG_KEY },
    create: { key: BG_KEY, value: url },
    update: { value: url },
  });
  revalidatePath("/");
  redirect("/admin/hero");
}

async function addSlide(formData: FormData) {
  "use server";
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!imageUrl) redirect("/admin/hero");
  const alt = String(formData.get("alt") ?? "").trim() || null;
  const href = String(formData.get("href") ?? "").trim() || null;
  const max = await prisma.heroSlide.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (max._max.sortOrder ?? -1) + 1;
  await prisma.heroSlide.create({
    data: { imageUrl, alt, href, sortOrder, isActive: true },
  });
  revalidatePath("/");
  redirect("/admin/hero");
}

async function toggleSlide(id: string) {
  "use server";
  const s = await prisma.heroSlide.findUnique({ where: { id } });
  if (!s) return;
  await prisma.heroSlide.update({
    where: { id },
    data: { isActive: !s.isActive },
  });
  revalidatePath("/");
  redirect("/admin/hero");
}

async function deleteSlide(id: string) {
  "use server";
  await prisma.heroSlide.delete({ where: { id } });
  revalidatePath("/");
  redirect("/admin/hero");
}

export default async function AdminHeroPage() {
  const [bg, slides] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: BG_KEY } }),
    prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-950">Accueil (hero)</h1>
        <p className="text-sm text-zinc-600">
          Image pleine largeur derrière le texte + carrousel à droite (slides).
        </p>
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-950 hover:underline"
        >
          Voir le site →
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Fond du hero (URL)
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Laissez vide pour utiliser l’image par défaut Traditions.
        </p>
        <form action={saveBackground} className="mt-4 flex flex-col gap-3">
          <input
            name="backgroundUrl"
            defaultValue={bg?.value ?? ""}
            placeholder="https://…"
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Enregistrer le fond
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Ajouter une slide (panneau droit)
        </h2>
        <form action={addSlide} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">URL image *</span>
            <input
              name="imageUrl"
              required
              className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              placeholder="https://…"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Texte alternatif</span>
            <input
              name="alt"
              className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Lien au clic (optionnel)</span>
            <input
              name="href"
              className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              placeholder="/shop ou https://…"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Ajouter
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Slides existantes
        </h2>
        {slides.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            Aucune slide — le site utilise l’image produit / défaut.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {slides.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-mono text-zinc-800">
                    {s.imageUrl}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {s.isActive ? "Actif" : "Masqué"}
                    {s.href ? ` · lien: ${s.href}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={toggleSlide.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-50"
                    >
                      {s.isActive ? "Masquer" : "Activer"}
                    </button>
                  </form>
                  <form action={deleteSlide.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
