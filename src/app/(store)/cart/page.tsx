"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notifyCartUpdated } from "@/lib/cart-events";

type CartLine = {
  id: string;
  quantity: number;
  name: string;
  slug: string;
  unitPriceXof: number;
  imageUrl: string | null;
  sizeLabel: string | null;
  colorHex: string | null;
};

type CartJson = {
  cart: { items: CartLine[] } | null;
  itemCount: number;
  subtotalXof: number;
};

export default function CartPage() {
  const [data, setData] = useState<CartJson | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const setQty = async (itemId: string, quantity: number) => {
    await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    notifyCartUpdated();
    refresh();
  };

  const remove = async (itemId: string) => {
    await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    notifyCartUpdated();
    refresh();
  };

  if (loading) {
    return <p className="text-sm text-zinc-600">Chargement du panier…</p>;
  }

  const items = data?.cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950">Panier</h1>
        <p className="text-sm text-zinc-600">Votre panier est vide.</p>
        <Link
          className="inline-flex w-fit rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          href="/shop"
        >
          Continuer les achats
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-zinc-950">Panier</h1>
      <ul className="flex flex-col gap-4">
        {items.map((line) => (
          <li
            key={line.id}
            className="flex flex-wrap gap-4 rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
              {line.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={line.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/shop/${line.slug}`}
                className="font-semibold text-zinc-950 hover:underline"
              >
                {line.name}
              </Link>
              <p className="text-sm text-zinc-600">
                {line.unitPriceXof.toLocaleString("fr-FR")} FCFA / unité
              </p>
              {(line.sizeLabel || line.colorHex) && (
                <p className="text-xs text-zinc-500">
                  {[line.sizeLabel, line.colorHex].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                className="h-9 w-16 rounded-lg border border-zinc-200 px-2 text-sm"
                defaultValue={line.quantity}
                key={`${line.id}-${line.quantity}`}
                onBlur={(e) =>
                  setQty(
                    line.id,
                    Math.max(1, Number((e.target as HTMLInputElement).value) || 1),
                  )
                }
              />
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={() => remove(line.id)}
              >
                Retirer
              </button>
            </div>
            <p className="w-full text-right text-sm font-semibold text-zinc-950 sm:w-auto">
              {(line.unitPriceXof * line.quantity).toLocaleString("fr-FR")}{" "}
              FCFA
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <p className="text-lg font-semibold text-zinc-950">
          Total : {(data?.subtotalXof ?? 0).toLocaleString("fr-FR")} FCFA
        </p>
        <Link
          className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-sm font-semibold text-white hover:bg-zinc-800"
          href="/checkout"
        >
          Commander
        </Link>
        <Link className="text-center text-sm text-zinc-600 underline" href="/shop">
          Continuer les achats
        </Link>
      </div>
    </div>
  );
}
