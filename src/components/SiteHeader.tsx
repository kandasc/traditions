"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CartBadge({ compact }: { compact?: boolean }) {
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
      className={[
        "relative inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 font-medium text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800",
        compact ? "px-3.5 text-sm" : "px-4 py-2 text-sm",
      ].join(" ")}
    >
      Panier
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

const sheetLinkClass =
  "block border-b border-zinc-100 px-5 py-3.5 text-base font-medium text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const mobileMenu =
    mobileOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            id="store-mobile-menu"
            className="fixed inset-0 z-[200] lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40 dark:bg-black/60"
              aria-label="Fermer le menu"
              onClick={() => setMobileOpen(false)}
            />
            <nav className="absolute right-0 top-0 flex h-full w-[min(100vw-2.5rem,22rem)] max-w-[100vw] flex-col overflow-y-auto border-l border-zinc-200 bg-white py-1 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
              <Link
                href="/shop"
                className={sheetLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/about"
                className={sheetLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                La marque
              </Link>
              <Link
                href="/atelier"
                className={sheetLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                L’atelier
              </Link>
              <div className="border-t border-zinc-200 px-3 py-4 dark:border-zinc-800">
                <Link
                  href="/cart"
                  className="flex min-h-12 items-center justify-center rounded-xl bg-zinc-950 text-base font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
                  onClick={() => setMobileOpen(false)}
                >
                  Voir le panier
                </Link>
              </div>
              {status === "loading" ? null : session ? (
                <>
                  <Link
                    href="/compte"
                    className={sheetLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    Mon compte
                  </Link>
                  <button
                    type="button"
                    className={`${sheetLinkClass} w-full border-0 text-left`}
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className={sheetLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Connexion
                </Link>
              )}
              {isAdmin ? (
                <Link
                  href="/admin"
                  className={sheetLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/90 backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-950/90 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:py-4">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold tracking-wide text-zinc-950 lg:flex-initial lg:shrink-0 dark:text-zinc-50"
        >
          <img
            src="/sayele-logo-black.svg"
            alt=""
            className="h-6 max-h-7 w-auto max-w-[min(11rem,48vw)] object-contain object-left dark:hidden sm:h-7 sm:max-w-[13rem]"
          />
          <img
            src="/sayele-logo-white.svg"
            alt=""
            className="hidden h-6 max-h-7 w-auto max-w-[min(11rem,48vw)] object-contain object-left dark:block sm:h-7 sm:max-w-[13rem]"
          />
          <span className="sr-only">SAYELE</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-700 lg:flex dark:text-zinc-300">
          <Link className="hover:text-zinc-950 dark:hover:text-white" href="/shop">
            Shop
          </Link>
          <Link className="hover:text-zinc-950 dark:hover:text-white" href="/about">
            La marque
          </Link>
          <Link
            className="hover:text-zinc-950 dark:hover:text-white"
            href="/atelier"
          >
            L’atelier
          </Link>
          <CartBadge />
          {status === "loading" ? null : session ? (
            <>
              <Link
                className="hover:text-zinc-950 dark:hover:text-white"
                href="/compte"
              >
                Mon compte
              </Link>
              <button
                type="button"
                className="text-left hover:text-zinc-950 dark:hover:text-white"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              href="/login"
            >
              Connexion
            </Link>
          )}
          {isAdmin ? (
            <Link
              className="rounded-full border border-zinc-200 px-4 py-2 text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              href="/admin"
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <CartBadge compact />
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-expanded={mobileOpen}
            aria-controls="store-mobile-menu"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>
    </header>
      {mobileMenu}
    </>
  );
}
