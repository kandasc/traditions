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
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="text-sm font-semibold text-zinc-950">
            Admin — Traditions
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-zinc-700">
            <Link className="hover:text-zinc-950" href="/">
              Voir le site
            </Link>
            <Link className="hover:text-zinc-950" href="/admin/products">
              Produits
            </Link>
            <Link className="hover:text-zinc-950" href="/admin/orders">
              Commandes
            </Link>
            <Link className="hover:text-zinc-950" href="/admin/delivery-zones">
              Livraison
            </Link>
            <Link className="hover:text-zinc-950" href="/admin/users">
              Utilisateurs
            </Link>
            <Link className="hover:text-zinc-950" href="/admin/pages">
              Pages
            </Link>
            <Link className="hover:text-zinc-950" href="/admin/hero">
              Hero
            </Link>
            <AdminSignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
