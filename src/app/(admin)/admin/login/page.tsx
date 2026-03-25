"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8">
          <h1 className="text-xl font-semibold text-zinc-950">Connexion admin</h1>
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
                redirect: true,
                callbackUrl: "/admin",
              });
              if (res?.error) setError("Email ou mot de passe incorrect.");
              setLoading(false);
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
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

