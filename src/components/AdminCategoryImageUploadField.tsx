"use client";

import { useId, useState } from "react";

type Props = {
  categoryId?: string;
  name?: string; // form field name, defaults to imageUrl
  defaultValue?: string;
};

export function AdminCategoryImageUploadField({
  categoryId,
  name = "imageUrl",
  defaultValue = "",
}: Props) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (categoryId) fd.append("categoryId", categoryId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Échec du téléversement");
      if (!data.url) throw new Error("URL manquante");
      setValue(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  await upload(f);
                }}
              />
              {uploading ? "Envoi…" : "Téléverser une image"}
            </label>
            {value ? (
              <button
                type="button"
                className="text-sm font-semibold text-zinc-600 hover:underline"
                onClick={() => setValue("")}
              >
                Retirer
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Ou collez une URL ci-dessous (optionnel).
          </p>
        </div>
      </div>

      <input type="hidden" name={name} value={value} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
        placeholder="https://… ou /image.png"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

