import Link from "next/link";
import { prisma } from "@/lib/db";

const statusFr: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  CANCELLED: "Annulée",
  FAILED: "Échouée",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Commandes</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Dernières commandes (tous clients).
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              href={`/admin/orders/${o.id}`}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-xs text-zinc-500">{o.id}</p>
                <p className="text-sm font-semibold text-zinc-950">
                  {o.amountXof.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-xs text-zinc-600">
                  {statusFr[o.status] ?? o.status}
                  {o.user?.email ? ` · ${o.user.email}` : ""}
                  {o.customerEmail && !o.user ? ` · ${o.customerEmail}` : ""}
                </p>
              </div>
              <span className="mt-2 text-sm text-zinc-950 sm:mt-0">
                {new Date(o.createdAt).toLocaleString("fr-FR")}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {orders.length === 0 ? (
        <p className="text-sm text-zinc-600">Aucune commande.</p>
      ) : null}
    </div>
  );
}
