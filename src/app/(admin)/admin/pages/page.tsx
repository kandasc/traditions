import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-950">Pages</h1>
        <p className="text-sm text-zinc-600">
          Contenus éditables (ex: About, Atelier).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-12 gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          <div className="col-span-3">Slug</div>
          <div className="col-span-7">Titre</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {pages.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm text-zinc-800"
          >
            <div className="col-span-3 font-mono text-xs text-zinc-600">
              {p.slug}
            </div>
            <div className="col-span-7 font-semibold text-zinc-950">
              {p.title}
            </div>
            <div className="col-span-2 flex justify-end">
              <Link
                className="text-sm font-semibold text-zinc-950 hover:underline"
                href={`/admin/pages/${p.id}`}
              >
                Éditer
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

