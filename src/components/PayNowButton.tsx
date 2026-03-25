"use client";

import { useState } from "react";

export function PayNowButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await fetch("/api/checkout/sayelepay/init", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ productId, quantity: 1 }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Checkout error");
            if (!data?.checkoutUrl) throw new Error("Missing checkoutUrl");
            window.location.href = data.checkoutUrl;
          } catch (e: any) {
            setError(e?.message ?? "Erreur de paiement");
            setLoading(false);
          }
        }}
      >
        {loading ? "Redirection..." : "Payer avec SayelePay"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

