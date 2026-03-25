"use client";

import { signOut } from "next-auth/react";

export function AdminSignOutButton() {
  return (
    <button
      type="button"
      className="text-left text-zinc-300 hover:text-zinc-50"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
    >
      Déconnexion
    </button>
  );
}
