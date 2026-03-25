"use client";

import { signOut } from "next-auth/react";

export function AdminSignOutButton() {
  return (
    <button
      type="button"
      className="text-left hover:text-zinc-950"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
    >
      Déconnexion
    </button>
  );
}
