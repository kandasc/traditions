"use client";

import { useRef } from "react";

type Props = {
  deleteProductWithId: () => Promise<void>;
};

export function DeleteProductForm({ deleteProductWithId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={deleteProductWithId} className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-6">
      <h2 className="text-sm font-semibold text-red-900">Zone danger</h2>
      <p className="mt-1 text-sm text-red-800">
        Supprime le produit, ses images et variantes.
      </p>
      <button
        type="button"
        className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-red-300 bg-white px-6 text-sm font-semibold text-red-800 hover:bg-red-50"
        onClick={() => {
          if (
            confirm(
              "Supprimer ce produit définitivement ? Cette action est irréversible.",
            )
          ) {
            formRef.current?.requestSubmit();
          }
        }}
      >
        Supprimer le produit
      </button>
    </form>
  );
}
