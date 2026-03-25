"use client";

import { useState, useTransition } from "react";
import { nanoid } from "nanoid";
import { updateProduct } from "./actions";

type ImageRow = { key: string; url: string; alt: string };
type VariantRow = { key: string; sizeLabel: string; colorHex: string; imageUrl: string };

export type ProductEditorInitial = {
  name: string;
  slug: string;
  priceXof: number | null;
  isActive: boolean;
  featured: boolean;
  description: string;
  details: string;
  images: { url: string; alt: string | null }[];
  variants: {
    sizeLabel: string | null;
    colorHex: string | null;
    imageUrl: string | null;
  }[];
};

function newKey() {
  return nanoid(10);
}

function colorPickerValue(hex: string) {
  return /^#[0-9A-Fa-f]{6}$/i.test(hex.trim()) ? hex.trim() : "#1a1a1a";
}

function colorToDb(hex: string): string | null {
  const s = hex.trim();
  if (!s) return null;
  if (/^#[0-9A-Fa-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^[0-9A-Fa-f]{6}$/i.test(s)) return `#${s.toLowerCase()}`;
  return null;
}

async function uploadAdminFile(file: File, productId: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("productId", productId);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = (await res.json()) as { url?: string; error?: string; code?: string };
  if (!res.ok) throw new Error(data.error ?? "Échec du téléversement");
  if (!data.url) throw new Error("URL manquante");
  return data.url;
}

export function ProductEditorForm({
  productId,
  initial,
  shopSlug,
}: {
  productId: string;
  initial: ProductEditorInitial;
  shopSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const [images, setImages] = useState<ImageRow[]>(() =>
    initial.images.length > 0
      ? initial.images.map((im) => ({
          key: newKey(),
          url: im.url,
          alt: im.alt ?? "",
        }))
      : [],
  );

  const [variants, setVariants] = useState<VariantRow[]>(() =>
    initial.variants.map((v) => ({
      key: newKey(),
      sizeLabel: v.sizeLabel ?? "",
      colorHex: v.colorHex ?? "",
      imageUrl: v.imageUrl ?? "",
    })),
  );

  return (
    <form
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        fd.set(
          "imagesJson",
          JSON.stringify(
            images
              .map((r) => ({
                url: r.url.trim(),
                alt: r.alt.trim() || null,
              }))
              .filter((r) => r.url.length > 0),
          ),
        );
        const variantPayload = variants
          .map((r) => ({
            sizeLabel: r.sizeLabel.trim() || null,
            colorHex: colorToDb(r.colorHex),
            imageUrl: r.imageUrl.trim() || null,
          }))
          .filter((v) => v.sizeLabel || v.colorHex || v.imageUrl);
        fd.set("variantsJson", JSON.stringify(variantPayload));

        startTransition(async () => {
          try {
            await updateProduct(productId, fd);
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur d’enregistrement");
          }
        });
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Nom
        </span>
        <input
          name="name"
          defaultValue={initial.name}
          required
          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Slug (URL)
        </span>
        <input
          name="slug"
          defaultValue={initial.slug}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Prix (FCFA)
        </span>
        <input
          name="priceXof"
          defaultValue={initial.priceXof ?? ""}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          inputMode="numeric"
        />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
        <label className="flex items-center gap-3">
          <input
            name="isActive"
            defaultChecked={initial.isActive}
            type="checkbox"
            className="h-4 w-4"
          />
          <span className="text-sm text-zinc-800">
            Actif (visible sur le site)
          </span>
        </label>
        <label className="flex items-center gap-3">
          <input
            name="featured"
            defaultChecked={initial.featured}
            type="checkbox"
            className="h-4 w-4"
          />
          <span className="text-sm text-zinc-800">Mis en avant (accueil)</span>
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Images
          </span>
          <button
            type="button"
            className="text-sm font-semibold text-zinc-950 underline decoration-zinc-300"
            onClick={() =>
              setImages((s) => [...s, { key: newKey(), url: "", alt: "" }])
            }
          >
            + Ajouter une image
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Téléversez un fichier (Vercel Blob requis en production) ou collez une
          URL. Glissez l’ordre avec les flèches.
        </p>
        {images.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune image pour l’instant.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {images.map((row, idx) => (
              <li
                key={row.key}
                className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
              >
                <div className="flex flex-wrap gap-3">
                  <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100">
                    {row.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.url}
                        alt={row.alt || ""}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="px-1 text-center text-[10px] text-zinc-400">
                        Aperçu
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="font-medium text-zinc-600">URL</span>
                      <input
                        value={row.url}
                        onChange={(e) =>
                          setImages((list) =>
                            list.map((r) =>
                              r.key === row.key
                                ? { ...r, url: e.target.value }
                                : r,
                            ),
                          )
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 font-mono text-xs outline-none focus:border-zinc-400"
                        placeholder="https://…"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="font-medium text-zinc-600">
                        Texte alternatif
                      </span>
                      <input
                        value={row.alt}
                        onChange={(e) =>
                          setImages((list) =>
                            list.map((r) =>
                              r.key === row.key
                                ? { ...r, alt: e.target.value }
                                : r,
                            ),
                          )
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none focus:border-zinc-400"
                        placeholder="Description courte"
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          className="hidden"
                          disabled={uploading === row.key}
                          onChange={async (ev) => {
                            const f = ev.target.files?.[0];
                            ev.target.value = "";
                            if (!f) return;
                            setUploading(row.key);
                            setError(null);
                            try {
                              const url = await uploadAdminFile(f, productId);
                              setImages((list) =>
                                list.map((r) =>
                                  r.key === row.key ? { ...r, url } : r,
                                ),
                              );
                            } catch (err: unknown) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Téléversement impossible",
                              );
                            } finally {
                              setUploading(null);
                            }
                          }}
                        />
                        {uploading === row.key
                          ? "Envoi…"
                          : "Choisir un fichier"}
                      </label>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:underline"
                        onClick={() =>
                          setImages((list) => list.filter((r) => r.key !== row.key))
                        }
                      >
                        Retirer
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-zinc-600 hover:underline disabled:opacity-40"
                        disabled={idx === 0}
                        onClick={() =>
                          setImages((list) => {
                            const next = [...list];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            return next;
                          })
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-zinc-600 hover:underline disabled:opacity-40"
                        disabled={idx === images.length - 1}
                        onClick={() =>
                          setImages((list) => {
                            const next = [...list];
                            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                            return next;
                          })
                        }
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Variantes (taille, couleur)
          </span>
          <button
            type="button"
            className="text-sm font-semibold text-zinc-950 underline decoration-zinc-300"
            onClick={() =>
              setVariants((s) => [
                ...s,
                { key: newKey(), sizeLabel: "", colorHex: "", imageUrl: "" },
              ])
            }
          >
            + Ajouter une variante
          </button>
        </div>
        {variants.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune variante (produit unique).</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {variants.map((row) => (
              <li
                key={row.key}
                className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-zinc-600">Taille</span>
                    <input
                      value={row.sizeLabel}
                      onChange={(e) =>
                        setVariants((list) =>
                          list.map((r) =>
                            r.key === row.key
                              ? { ...r, sizeLabel: e.target.value }
                              : r,
                          ),
                        )
                      }
                      className="h-10 rounded-lg border border-zinc-200 px-2 text-sm outline-none focus:border-zinc-400"
                      placeholder="ex. S, M, Unique"
                    />
                  </label>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-zinc-600">Couleur</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="color"
                        aria-label="Nuancier"
                        className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white"
                        value={colorPickerValue(row.colorHex)}
                        onChange={(e) =>
                          setVariants((list) =>
                            list.map((r) =>
                              r.key === row.key
                                ? { ...r, colorHex: e.target.value }
                                : r,
                            ),
                          )
                        }
                      />
                      <input
                        value={row.colorHex}
                        onChange={(e) =>
                          setVariants((list) =>
                            list.map((r) =>
                              r.key === row.key
                                ? { ...r, colorHex: e.target.value }
                                : r,
                            ),
                          )
                        }
                        className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 px-2 font-mono text-xs outline-none focus:border-zinc-400"
                        placeholder="#ff00aa ou vide"
                      />
                      <button
                        type="button"
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                        onClick={() =>
                          setVariants((list) =>
                            list.map((r) =>
                              r.key === row.key ? { ...r, colorHex: "" } : r,
                            ),
                          )
                        }
                      >
                        Effacer
                      </button>
                    </div>
                  </div>
                  <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <span className="font-medium text-zinc-600">
                      Image de variante (URL)
                    </span>
                    <input
                      value={row.imageUrl}
                      onChange={(e) =>
                        setVariants((list) =>
                          list.map((r) =>
                            r.key === row.key
                              ? { ...r, imageUrl: e.target.value }
                              : r,
                          ),
                        )
                      }
                      className="rounded-lg border border-zinc-200 px-2 py-1.5 font-mono text-xs outline-none focus:border-zinc-400"
                      placeholder="https://… (optionnel)"
                    />
                  </label>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        className="hidden"
                        disabled={uploading === `v-${row.key}`}
                        onChange={async (ev) => {
                          const f = ev.target.files?.[0];
                          ev.target.value = "";
                          if (!f) return;
                          setUploading(`v-${row.key}`);
                          setError(null);
                          try {
                            const url = await uploadAdminFile(f, productId);
                            setVariants((list) =>
                              list.map((r) =>
                                r.key === row.key ? { ...r, imageUrl: url } : r,
                              ),
                            );
                          } catch (err: unknown) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Téléversement impossible",
                            );
                          } finally {
                            setUploading(null);
                          }
                        }}
                      />
                      {uploading === `v-${row.key}`
                        ? "Envoi…"
                        : "Fichier pour cette variante"}
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600 hover:underline"
                      onClick={() =>
                        setVariants((list) =>
                          list.filter((r) => r.key !== row.key),
                        )
                      }
                    >
                      Supprimer la variante
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Description
        </span>
        <textarea
          name="description"
          defaultValue={initial.description}
          className="min-h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Détails
        </span>
        <textarea
          name="details"
          defaultValue={initial.details}
          className="min-h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <a
          className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
          href={`/shop/${shopSlug}`}
        >
          Voir sur le site
        </a>
      </div>
    </form>
  );
}
