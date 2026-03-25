"use client";

import { signOut } from "next-auth/react";

export function AdminSignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={[
        "text-left text-sm font-medium text-zinc-300 hover:text-zinc-50",
        className ?? "",
      ].join(" ")}
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
    >
      Déconnexion
    </button>
  );
}
