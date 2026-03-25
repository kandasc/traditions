"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  /** Path after origin when the user cancels checkout (default: compte order page). */
  cancelPath?: string;
  className?: string;
  children?: React.ReactNode;
};

export function ResumeSayelePayButton({
  orderId,
  cancelPath,
  className,
  children,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/sayelepay/resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const text = await res.text();
      let data: { error?: string; clientSecret?: string } = {};
      if (text.trim()) {
        try {
          data = JSON.parse(text) as typeof data;
        } catch {
          throw new Error("Réponse invalide");
        }
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de reprendre le paiement");
      }
      const secret = data.clientSecret;
      if (!secret) {
        throw new Error("Réponse sans client_secret");
      }
      const pk = process.env.NEXT_PUBLIC_SAYELEPAY_PUBLISHABLE_KEY;
      if (!pk) {
        throw new Error(
          "NEXT_PUBLIC_SAYELEPAY_PUBLISHABLE_KEY manquant. Voir https://www.sayelepay.com/sdk",
        );
      }
      const origin = window.location.origin;
      const cancel =
        cancelPath ??
        `/checkout/payment-canceled?orderId=${encodeURIComponent(orderId)}`;
      const { redirectToSayelePayCheckout } = await import(
        "@/lib/sayelepay-sdk-client"
      );
      await redirectToSayelePayCheckout({
        publishableKey: pk,
        clientSecret: secret,
        successUrl: `${origin}/checkout/success?orderId=${encodeURIComponent(orderId)}`,
        cancelUrl: `${origin}${cancel.startsWith("/") ? cancel : `/${cancel}`}`,
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void onClick()}
        className={
          className ??
          "inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        }
      >
        {busy ? "Ouverture…" : (children ?? "Reprendre le paiement")}
      </button>
      {err ? (
        <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
      ) : null}
    </div>
  );
}
