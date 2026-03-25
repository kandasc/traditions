import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function AtelierPage() {
  const page = await prisma.page.findUnique({ where: { slug: "atelier" } });
  if (!page || !page.isActive) return notFound();

  return (
    <div className="flex flex-col gap-8">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {page.title}
        </h1>
        <div className="flex flex-col gap-4 text-sm leading-7 text-zinc-700">
          {page.body.split("\n").map((line, idx) =>
            line.trim() ? (
              <p key={idx}>{line}</p>
            ) : (
              <div key={idx} className="h-2" />
            ),
          )}
        </div>
      </article>
      <div className="flex flex-col gap-3">
        <Link
          className="inline-flex w-fit items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          href="https://wa.me/2250710074284"
          target="_blank"
          rel="noreferrer"
        >
          Demander un RDV
        </Link>
        <p className="text-xs text-zinc-500">
          Le bouton ouvre WhatsApp (comme sur le site actuel).
        </p>
      </div>
    </div>
  );
}

