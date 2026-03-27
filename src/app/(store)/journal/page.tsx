import Link from "next/link";

const items = [
  {
    slug: "coulisses",
    title: "Coulisses",
    excerpt: "Atelier, matières, gestes — l’envers du décor.",
  },
  {
    slug: "inspirations",
    title: "Inspirations",
    excerpt: "Couleurs, silhouettes, histoires qui nourrissent la création.",
  },
  {
    slug: "articles",
    title: "Articles",
    excerpt: "Editorials et notes de la maison.",
  },
];

export default function JournalPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Journal
        </h1>
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Articles, coulisses et inspirations.
        </p>
      </header>

      <div className="mx-auto grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <div
            key={i.slug}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {i.title}
            </p>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {i.excerpt}
            </p>
            <p className="mt-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Bientôt disponible
            </p>
          </div>
        ))}
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <Link href="/shop" className="text-sm font-semibold hover:underline">
          → Découvrir la collection
        </Link>
      </div>
    </div>
  );
}

