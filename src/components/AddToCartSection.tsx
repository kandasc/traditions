"use client";

import { useEffect, useMemo, useState } from "react";
import { notifyCartUpdated } from "@/lib/cart-events";

export type VariantOption = {
  id: string;
  sizeLabel: string | null;
  colorHex: string | null;
  stock?: number | null;
};

function normHex(s: string | null | undefined): string {
  if (s == null || !String(s).trim()) return "";
  const t = String(s).trim();
  if (t.startsWith("#")) return t.slice(0, 7).toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(t)) return `#${t.toLowerCase()}`;
  return t.toLowerCase();
}

function dedupeVariants(variants: VariantOption[]): VariantOption[] {
  const seen = new Set<string>();
  const out: VariantOption[] = [];
  for (const v of variants) {
    const k = `${v.sizeLabel ?? "∅"}|${normHex(v.colorHex)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

export function AddToCartSection({
  productId,
  variants,
}: {
  productId: string;
  variants: VariantOption[];
}) {
  const deduped = useMemo(() => dedupeVariants(variants), [variants]);

  const sizeChoices = useMemo(() => {
    const s = new Set<string>();
    for (const v of deduped) {
      if (v.sizeLabel) s.add(v.sizeLabel);
    }
    return [...s];
  }, [deduped]);

  const colorChoices = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of deduped) {
      if (!v.colorHex) continue;
      const n = normHex(v.colorHex);
      if (n) m.set(n, v.colorHex.startsWith("#") ? v.colorHex : `#${v.colorHex}`);
    }
    return [...m.entries()].map(([, raw]) => raw);
  }, [deduped]);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const variantKey = `${productId}:${deduped.map((d) => d.id).join(",")}`;

  useEffect(() => {
    if (deduped.length === 1) {
      setSelectedSize(deduped[0].sizeLabel);
      setSelectedColorHex(deduped[0].colorHex);
      return;
    }
    setSelectedSize(sizeChoices.length === 1 ? sizeChoices[0]! : null);
    setSelectedColorHex(colorChoices.length === 1 ? colorChoices[0]! : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset defaults when product / variants change
  }, [variantKey]);

  const variantId = useMemo(() => {
    if (deduped.length === 0) return null;
    if (deduped.length === 1) return deduped[0].id;

    const needSize = sizeChoices.length > 0;
    const needColor = colorChoices.length > 0;
    if (needSize && (selectedSize == null || selectedSize === "")) return null;
    if (
      needColor &&
      (selectedColorHex == null || normHex(selectedColorHex) === "")
    )
      return null;

    const match = deduped.find((v) => {
      const sizeOk =
        !needSize || (v.sizeLabel ?? "") === (selectedSize ?? "");
      const colorOk =
        !needColor ||
        normHex(v.colorHex) === normHex(selectedColorHex);
      return sizeOk && colorOk;
    });

    return match?.id ?? null;
  }, [
    deduped,
    sizeChoices.length,
    colorChoices.length,
    selectedSize,
    selectedColorHex,
  ]);

  const selectedVariantStock = useMemo(() => {
    if (!variantId) return null;
    const v = deduped.find((x) => x.id === variantId);
    return v?.stock ?? null;
  }, [deduped, variantId]);

  const maxQty = useMemo(() => {
    if (selectedVariantStock == null) return null; // unlimited
    const s = Math.max(0, Number(selectedVariantStock) || 0);
    return s > 0 ? s : 0;
  }, [selectedVariantStock]);

  useEffect(() => {
    // If stock is limited and quantity is above it, clamp.
    if (maxQty == null) return;
    setQuantity((q) => Math.min(q, Math.max(1, maxQty)));
  }, [maxQty]);

  const add = async () => {
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      if (maxQty != null && maxQty <= 0) {
        setError("Rupture de stock.");
        return;
      }
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: variantId ?? undefined,
          quantity,
        }),
      });
      const text = await res.text();
      let data: { error?: string } = {};
      if (text.trim()) {
        try {
          data = JSON.parse(text) as { error?: string };
        } catch {
          throw new Error("Réponse panier invalide");
        }
      }
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setOk(true);
      notifyCartUpdated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const sectionTitle =
    "text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300";
  const chipBase =
    "rounded-full border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500";

  return (
    <div className="flex flex-col gap-5">
      {deduped.length > 0 ? (
        <>
          {sizeChoices.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className={sectionTitle}>Tailles</h3>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Taille">
                {sizeChoices.map((s) => {
                  const active = selectedSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedSize(s)}
                      className={`${chipBase} border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 ${
                        active
                          ? "border-zinc-950 ring-2 ring-zinc-950 dark:border-zinc-100 dark:ring-zinc-100"
                          : ""
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {colorChoices.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className={sectionTitle}>Couleurs</h3>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Couleur">
                {colorChoices.map((raw) => {
                  const n = normHex(raw);
                  const active =
                    selectedColorHex != null && normHex(selectedColorHex) === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      title={raw}
                      aria-label={`Couleur ${raw}`}
                      aria-pressed={active}
                      onClick={() => setSelectedColorHex(raw)}
                      className={`relative h-10 w-10 rounded-full border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-black ${
                        active
                          ? "border-zinc-950 ring-2 ring-zinc-950 ring-offset-2 dark:border-white dark:ring-white"
                          : "border-zinc-300 dark:border-zinc-500"
                      }`}
                      style={{ backgroundColor: raw }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {variantId
              ? "Combinaison sélectionnée."
              : "Choisissez la taille et la couleur (si affichées)."}
          </p>
        </>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className={sectionTitle}>Quantité</span>
        <input
          type="number"
          min={1}
          max={maxQty == null ? undefined : maxQty}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, Number(e.target.value) || 1))
          }
          className="h-11 w-28 rounded-xl border border-zinc-200 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <button
        type="button"
        disabled={
          loading ||
          (deduped.length > 0 && !variantId) ||
          (maxQty != null && maxQty <= 0)
        }
        className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        onClick={add}
      >
        {loading ? "Ajout…" : "Ajouter au panier"}
      </button>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {ok ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Ajouté au panier.{" "}
          <a className="font-semibold underline" href="/cart">
            Voir le panier
          </a>
        </p>
      ) : null}
    </div>
  );
}
