"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";

type DeliveryZoneOption = { id: string; name: string; feeXof: number };

export default function CheckoutPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zones, setZones] = useState<DeliveryZoneOption[]>([]);
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
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
    let cancelled = false;
    Promise.all([
      fetch("/api/cart").then((r) => r.json()),
      fetch("/api/delivery-zones").then((r) => r.json()),
    ])
      .then(([cart, dz]) => {
        if (cancelled) return;
        setCartTotal(cart.subtotalXof ?? 0);
        setItemCount(cart.itemCount ?? 0);
        const list = (dz.zones ?? []) as DeliveryZoneOption[];
        setZones(list);
        if (list.length === 1) {
          setDeliveryZoneId(list[0].id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deliveryFee = useMemo(() => {
    const z = zones.find((x) => x.id === deliveryZoneId);
    return z?.feeXof ?? 0;
  }, [zones, deliveryZoneId]);

  const orderTotal = cartTotal + deliveryFee;

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
          Sous-total :{" "}
          <span className="font-medium text-zinc-950 dark:text-zinc-50">
            {cartTotal.toLocaleString("fr-FR")} FCFA
          </span>
          {deliveryZoneId ? (
            <>
              {" "}
              · Livraison :{" "}
              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                {deliveryFee.toLocaleString("fr-FR")} FCFA
              </span>
            </>
          ) : null}
          <br />
          <span className="mt-1 inline-block font-semibold text-zinc-950 dark:text-zinc-50">
            Total : {orderTotal.toLocaleString("fr-FR")} FCFA
          </span>{" "}
          — paiement sécurisé.
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
                customerPhone: phone,
                customerAddress: address,
                deliveryZoneId,
              }),
            });
            const text = await res.text();
            let data: {
              error?: string;
              checkoutUrl?: string;
              clientSecret?: string;
              orderId?: string;
            } = {};
            if (text.trim()) {
              try {
                data = JSON.parse(text) as typeof data;
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
            const orderId = data.orderId as string | undefined;
            const url = data.checkoutUrl as string | undefined;
            const secret = data.clientSecret as string | undefined;
            if (url && typeof url === "string") {
              window.location.href = url;
              return;
            }
            if (secret && orderId) {
              const pk = process.env.NEXT_PUBLIC_SAYELEPAY_PUBLISHABLE_KEY;
              if (!pk) {
                throw new Error(
                  "NEXT_PUBLIC_SAYELEPAY_PUBLISHABLE_KEY manquant (clé publique pk_test_… / pk_live_… du tableau de bord SayelePay). Voir https://www.sayelepay.com/sdk",
                );
              }
              const { redirectToSayelePayCheckout } = await import(
                "@/lib/sayelepay-sdk-client"
              );
              await redirectToSayelePayCheckout({
                publishableKey: pk,
                clientSecret: secret,
                successUrl: `${window.location.origin}/checkout/success?orderId=${encodeURIComponent(orderId)}`,
                cancelUrl: `${window.location.origin}/checkout/payment-canceled?orderId=${encodeURIComponent(orderId)}`,
              });
              return;
            }
            throw new Error(
              "Réponse SayelePay incomplète (pas d’URL ni de client_secret).",
            );
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

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Téléphone (livraison)
          </span>
          <input
            required
            type="tel"
            autoComplete="tel"
            placeholder="+225 …"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Adresse complète de livraison
          </span>
          <textarea
            required
            rows={3}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            placeholder="Rue, quartier, repères…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Zone de livraison
          </span>
          {zones.length === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Aucune zone de livraison n’est configurée pour le moment. Revenez
              plus tard ou contactez la boutique.
            </p>
          ) : (
            <select
              required
              value={deliveryZoneId}
              onChange={(e) => setDeliveryZoneId(e.target.value)}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Choisir…</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {z.feeXof.toLocaleString("fr-FR")} FCFA
                </option>
              ))}
            </select>
          )}
        </label>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || zones.length === 0}
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
