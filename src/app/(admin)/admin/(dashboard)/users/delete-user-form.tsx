"use client";

import { useRef } from "react";
import { deleteUser } from "./actions";

export function DeleteUserForm({
  userId,
  label,
}: {
  userId: string;
  label: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async () => {
        await deleteUser(userId);
      }}
    >
      <button
        type="button"
        className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
        onClick={() => {
          if (confirm(`Supprimer ${label} ?`)) ref.current?.requestSubmit();
        }}
      >
        Supprimer
      </button>
    </form>
  );
}
