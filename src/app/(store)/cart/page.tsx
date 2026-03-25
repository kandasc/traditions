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
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Chargement du panier…
      </p>
    );
  }

  const items = data?.cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Panier
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Votre panier est vide.
        </p>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-base font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:w-fit sm:text-sm"
          href="/shop"
        >
          Continuer les achats
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Panier
      </h1>
      <ul className="flex flex-col gap-4">
        {items.map((line) => (
          <li
            key={line.id}
            className="flex flex-wrap items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-24 sm:w-20 dark:bg-zinc-900">
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
                className="font-semibold text-zinc-950 hover:underline dark:text-zinc-50"
              >
                {line.name}
              </Link>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {line.unitPriceXof.toLocaleString("fr-FR")} FCFA / unité
              </p>
              {(line.sizeLabel || line.colorHex) && (
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {[line.sizeLabel, line.colorHex].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                min={1}
                inputMode="numeric"
                className="h-12 w-20 rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-950 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
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
                className="min-h-11 text-base text-red-600 hover:underline sm:text-sm dark:text-red-400"
                onClick={() => remove(line.id)}
              >
                Retirer
              </button>
            </div>
            <p className="w-full text-lg font-semibold text-zinc-950 sm:w-auto sm:text-right sm:text-sm dark:text-zinc-50">
              {(line.unitPriceXof * line.quantity).toLocaleString("fr-FR")}{" "}
              FCFA
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Total : {(data?.subtotalXof ?? 0).toLocaleString("fr-FR")} FCFA
        </p>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-base font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:text-sm"
          href="/checkout"
        >
          Commander
        </Link>
        <Link
          className="min-h-11 text-center text-base text-zinc-600 underline dark:text-zinc-400 sm:text-sm"
          href="/shop"
        >
          Continuer les achats
        </Link>
      </div>
    </div>
  );
}
