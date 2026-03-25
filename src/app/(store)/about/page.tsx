import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function AboutPage() {
  const page = await prisma.page.findUnique({ where: { slug: "about" } });
  if (!page || !page.isActive) return notFound();

  return (
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
  );
}

