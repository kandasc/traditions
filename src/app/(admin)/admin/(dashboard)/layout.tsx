import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="text-sm font-semibold text-zinc-950">
            Admin — Traditions
          </Link>
          <nav className="flex items-center gap-5 text-sm text-zinc-700">
            <Link className="hover:text-zinc-950" href="/">
              Voir le site
            </Link>
            <Link className="hover:text-zinc-950" href="/admin/products">
              Produits
            </Link>
            <Link className="hover:text-zinc-950" href="/admin/pages">
              Pages
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
