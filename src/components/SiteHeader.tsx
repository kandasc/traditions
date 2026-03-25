import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide text-zinc-950"
        >
          Traditions
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-700">
          <Link className="hover:text-zinc-950" href="/shop">
            Shop
          </Link>
          <Link className="hover:text-zinc-950" href="/about">
            La marque
          </Link>
          <Link className="hover:text-zinc-950" href="/atelier">
            L’atelier
          </Link>
          <Link
            className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-950 hover:bg-zinc-50"
            href="/admin"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

