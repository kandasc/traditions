"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrlRaw = searchParams.get("callbackUrl") ?? "/";
  const callbackUrl = callbackUrlRaw.startsWith("/") ? callbackUrlRaw : "/";
  const err = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    err === "forbidden" ? "Accès refusé pour ce compte." : null,
  );
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950 sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Connexion
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Connectez-vous pour suivre vos commandes.
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
            await fetch("/api/cart/merge", { method: "POST" });
            window.location.href = callbackUrl;
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Email
            </span>
            <input
              className="min-h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Mot de passe
            </span>
            <input
              className="min-h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <button
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-base font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:text-sm"
            type="submit"
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Pas encore de compte ?{" "}
          <Link
            className="font-semibold text-zinc-950 underline dark:text-zinc-50"
            href="/register"
          >
            Créer un profil
          </Link>
        </p>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
          <Link className="underline" href="/">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-600">Chargement…</div>}>
      <LoginForm />
    </Suspense>
  );
}
