import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeaderNav } from "@/components/AdminHeaderNav";

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
      <header className="border-b border-zinc-800 bg-zinc-950 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src="/sayele-logo-white.svg"
              alt="SAYELE"
              className="h-6 w-auto shrink-0"
            />
            <div className="truncate text-sm font-semibold text-zinc-50">
              Admin
            </div>
          </Link>
          <AdminHeaderNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
