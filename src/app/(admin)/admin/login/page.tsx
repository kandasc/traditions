"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession, signIn, signOut } from "next-auth/react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 px-4 py-4 sm:max-w-lg">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/sayele-logo-white.svg"
              alt=""
              className="h-7 w-auto shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-50">Admin</p>
              <p className="truncate text-xs text-zinc-400">
                Connexion sécurisée
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            ← Site
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 sm:max-w-lg">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-zinc-950">
              Connexion administrateur
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Utilisez le compte seedé (à changer ensuite).
            </p>

            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                const res = await signIn("credentials", {
                  email,
                  password,
                  redirect: false,
                });
                if (res?.error) {
                  setError("Email ou mot de passe incorrect.");
                  setLoading(false);
                  return;
                }
                const session = await getSession();
                if (session?.user?.role !== "admin") {
                  setError("Ce compte n’est pas administrateur.");
                  setLoading(false);
                  await signOut({ redirect: false });
                  return;
                }
                await fetch("/api/cart/merge", { method: "POST" });
                window.location.href = "/admin";
              }}
            >
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Email
                </span>
                <input
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Mot de passe
                </span>
                <input
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </label>

              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Par défaut: <span className="font-mono">admin@local</span> /{" "}
                  <span className="font-mono">admin123</span>
                </p>
              )}

              <button
                className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-zinc-500">
            Built by <span className="font-semibold text-zinc-700">SAYELE</span>
          </p>
        </div>
      </div>
    </div>
  );
}
