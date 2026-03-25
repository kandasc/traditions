import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSignOutButton } from "./sign-out-button";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  if (session.user.role !== "admin") {
    redirect("/login?error=forbidden");
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <img
              src="/sayele-logo-white.svg"
              alt="SAYELE"
              className="h-6 w-auto"
            />
            <div className="text-sm font-semibold text-zinc-50">
              Admin <span className="text-zinc-400">— Traditions</span>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-zinc-300">
            <Link className="hover:text-zinc-50" href="/">
              Voir le site
            </Link>
            <Link className="hover:text-zinc-50" href="/admin/products">
              Produits
            </Link>
            <Link className="hover:text-zinc-50" href="/admin/orders">
              Commandes
            </Link>
            <Link className="hover:text-zinc-50" href="/admin/report">
              Report
            </Link>
            <Link className="hover:text-zinc-50" href="/admin/delivery-zones">
              Livraison
            </Link>
            <Link className="hover:text-zinc-50" href="/admin/users">
              Utilisateurs
            </Link>
            <Link className="hover:text-zinc-50" href="/admin/pages">
              Pages
            </Link>
            <Link className="hover:text-zinc-50" href="/admin/hero">
              Hero
            </Link>
            <AdminSignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-center text-xs text-zinc-500">
          <span>
            Built by <span className="font-semibold text-zinc-700">SAYELE</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
