import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

async function updatePage(id: string, formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!title) throw new Error("Title is required");

  await prisma.page.update({
    where: { id },
    data: { title, body, isActive },
  });

  redirect(`/admin/pages/${id}`);
}

export default async function AdminPageEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-950">
        Éditer page: <span className="font-mono text-lg">{page.slug}</span>
      </h1>

      <form
        action={updatePage.bind(null, id)}
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Titre
          </span>
          <input
            name="title"
            defaultValue={page.title}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            name="isActive"
            defaultChecked={page.isActive}
            type="checkbox"
            className="h-4 w-4"
          />
          <span className="text-sm text-zinc-800">Actif</span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Contenu
          </span>
          <textarea
            name="body"
            defaultValue={page.body}
            className="min-h-72 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <p className="text-xs text-zinc-500">Astuce: sauts de ligne = paragraphes.</p>
        </label>

        <button
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
          type="submit"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}

