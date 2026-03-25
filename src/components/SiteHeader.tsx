"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

function CartBadge() {
  const [count, setCount] = useState(0);
  const refresh = () => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d) => setCount(typeof d.itemCount === "number" ? d.itemCount : 0))
      .catch(() => setCount(0));
  };
  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener("traditions:cart", h);
    return () => window.removeEventListener("traditions:cart", h);
  }, []);
  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center rounded-full border border-zinc-200 px-4 py-2 text-zinc-950 hover:bg-zinc-50"
    >
      Panier
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export function SiteHeader() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide text-zinc-950"
        >
          Traditions
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-700 sm:gap-6">
          <Link className="hover:text-zinc-950" href="/shop">
            Shop
          </Link>
          <Link className="hover:text-zinc-950" href="/about">
            La marque
          </Link>
          <Link className="hover:text-zinc-950" href="/atelier">
            L’atelier
          </Link>
          <CartBadge />
          {status === "loading" ? null : session ? (
            <>
              <Link
                className="hover:text-zinc-950"
                href="/compte"
              >
                Mon compte
              </Link>
              <button
                type="button"
                className="text-left hover:text-zinc-950"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-950 hover:bg-zinc-50"
              href="/login"
            >
              Connexion
            </Link>
          )}
          {isAdmin ? (
            <Link
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-950 hover:bg-zinc-50"
              href="/admin"
            >
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
