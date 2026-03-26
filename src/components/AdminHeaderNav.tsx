"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AdminSignOutButton } from "@/app/(admin)/admin/(dashboard)/sign-out-button";

const items: { href: string; label: string }[] = [
  { href: "/", label: "Voir le site" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/report", label: "Rapport" },
  { href: "/admin/delivery-zones", label: "Livraison" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/hero", label: "Hero" },
];

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

export function AdminHeaderNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <nav className="hidden items-center gap-4 text-sm text-zinc-300 lg:flex lg:flex-wrap lg:gap-5">
        {items.map((it) => (
          <Link key={it.href} className="hover:text-zinc-50" href={it.href}>
            {it.label}
          </Link>
        ))}
        <AdminSignOutButton />
      </nav>

      <button
        type="button"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white lg:hidden"
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <MenuIcon open={open} />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id="admin-mobile-nav"
              className="fixed inset-0 z-[200] lg:hidden"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/50"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
              />
              <nav className="absolute right-0 top-0 flex h-full w-[min(100vw-2.5rem,20rem)] max-w-[100vw] flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950 py-1 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] shadow-2xl">
                {items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    className="border-b border-zinc-800/80 px-5 py-3.5 text-base font-medium text-zinc-200 hover:bg-zinc-900"
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </Link>
                ))}
                <div className="px-5 pt-4">
                  <AdminSignOutButton className="flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-700 px-4 py-3 text-base font-medium text-zinc-200 hover:bg-zinc-900 hover:text-white" />
                </div>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
