import { prisma } from "@/lib/db";
import { createUser } from "./actions";
import { DeleteUserForm } from "./delete-user-form";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Utilisateurs</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Comptes admin (back-office) et clients (commandes / profil).
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Nouvel utilisateur
        </h2>
        <form action={createUser} className="mt-4 flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="email@exemple.com"
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
          />
          <input
            name="name"
            placeholder="Nom (optionnel)"
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Mot de passe (8 caractères min.)"
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
          />
          <select
            name="role"
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            defaultValue="customer"
          >
            <option value="customer">Client</option>
            <option value="admin">Administrateur</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Créer
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Comptes existants
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-950">
                  {u.email}{" "}
                  <span className="font-normal text-zinc-500">
                    ({u.role === "admin" ? "admin" : "client"})
                  </span>
                </p>
                {u.name ? (
                  <p className="text-xs text-zinc-600">{u.name}</p>
                ) : null}
                <p className="text-xs text-zinc-400">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <DeleteUserForm userId={u.id} label={u.email ?? u.id} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
