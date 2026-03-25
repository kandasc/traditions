"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950 sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Créer un compte
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Votre compte permet d’enregistrer le panier et de suivre vos commandes.
        </p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const res = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data?.error ?? "Inscription impossible");
              setLoading(false);
              return;
            }
            const sign = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
            if (sign?.error) {
              setError("Compte créé mais connexion échouée — essayez de vous connecter.");
              setLoading(false);
              return;
            }
            await fetch("/api/cart/merge", { method: "POST" });
            window.location.href = "/compte";
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Nom
            </span>
            <input
              className="min-h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 sm:text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
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
              Mot de passe (8 caractères min.)
            </span>
            <input
              className="min-h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
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
            {loading ? "Création…" : "S’inscrire"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Déjà inscrit ?{" "}
          <Link
            className="font-semibold text-zinc-950 underline dark:text-zinc-50"
            href="/login"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
