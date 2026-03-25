"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cartTotal, setCartTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
    if (session?.user?.name) setName(session.user.name ?? "");
  }, [session]);

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d) => {
        setCartTotal(d.subtotalXof ?? 0);
        setItemCount(d.itemCount ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</p>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Commande
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Votre panier est vide.
        </p>
        <Link
          className="font-semibold text-zinc-950 underline dark:text-zinc-50"
          href="/shop"
        >
          Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Paiement
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Total estimé :{" "}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            {cartTotal.toLocaleString("fr-FR")} FCFA
          </span>{" "}
          — redirection vers la page de paiement sécurisée.
        </p>
      </div>

      <form
        className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          setError(null);
          try {
            const res = await fetch("/api/checkout/sayelepay/init", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                fromCart: true,
                customerEmail: email,
                customerName: name,
              }),
            });
            const text = await res.text();
            let data: { error?: string; checkoutUrl?: string } = {};
            if (text.trim()) {
              try {
                data = JSON.parse(text) as {
                  error?: string;
                  checkoutUrl?: string;
                };
              } catch {
                throw new Error(
                  "Réponse serveur illisible. Vérifiez la configuration du paiement.",
                );
              }
            } else if (!res.ok) {
              throw new Error(
                `Erreur serveur (${res.status}), réponse vide — souvent liée au paiement ou au proxy.`,
              );
            }
            if (!res.ok) {
              throw new Error(data.error ?? "Erreur de commande");
            }
            if (!data.checkoutUrl || typeof data.checkoutUrl !== "string") {
              throw new Error("URL de paiement manquante");
            }
            window.location.href = data.checkoutUrl;
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
            setSubmitting(false);
          }
        }}
      >
        {!session?.user?.email ? (
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Email (reçu de confirmation)
            </span>
            <input
              required
              type="email"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Commande liée à{" "}
            <span className="font-medium text-zinc-950 dark:text-zinc-50">
              {session.user.email}
            </span>
          </p>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Nom sur la commande
          </span>
          <input
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          {submitting ? "Redirection…" : "Payer"}
        </button>
      </form>

      <Link
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
        href="/cart"
      >
        ← Retour au panier
      </Link>
    </div>
  );
}
