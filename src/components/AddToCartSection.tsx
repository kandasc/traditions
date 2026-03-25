"use client";

import { useMemo, useState } from "react";
import { notifyCartUpdated } from "@/lib/cart-events";

export type VariantOption = {
  id: string;
  sizeLabel: string | null;
  colorHex: string | null;
};

export function AddToCartSection({
  productId,
  variants,
}: {
  productId: string;
  variants: VariantOption[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const labels = useMemo(() => {
    return variants.map((v) => ({
      id: v.id,
      label: [v.sizeLabel, v.colorHex].filter(Boolean).join(" · ") || "Standard",
    }));
  }, [variants]);

  const add = async () => {
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: variantId ?? undefined,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");
      setOk(true);
      notifyCartUpdated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {variants.length > 0 ? (
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Taille / couleur
          </span>
          <select
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            value={variantId ?? ""}
            onChange={(e) => setVariantId(e.target.value || null)}
          >
            <option value="">Choisir…</option>
            {labels.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Quantité
        </span>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, Number(e.target.value) || 1))
          }
          className="h-11 w-28 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
        />
      </label>

      <button
        type="button"
        disabled={loading || (variants.length > 0 && !variantId)}
        className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        onClick={add}
      >
        {loading ? "Ajout…" : "Ajouter au panier"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {ok ? (
        <p className="text-sm text-emerald-700">
          Ajouté au panier.{" "}
          <a className="font-semibold underline" href="/cart">
            Voir le panier
          </a>
        </p>
      ) : null}
    </div>
  );
}
