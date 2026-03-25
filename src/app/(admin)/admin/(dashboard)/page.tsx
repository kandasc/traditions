import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminHome() {
  const [
    productsCount,
    pagesCount,
    ordersCount,
    usersCount,
    zonesCount,
    paidOrdersCount,
    paidRevenueAgg,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.page.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.deliveryZone.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({
      _sum: { amountXof: true },
      where: { status: "PAID" },
    }),
  ]);

  const paidRevenueXof = paidRevenueAgg._sum.amountXof ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-950">Dashboard</h1>
        <p className="text-sm text-zinc-600">
          Vue rapide de l’activité e-commerce et de la performance.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Produits</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">
          {productsCount}
        </p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/products"
        >
          Gérer les produits →
        </Link>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Pages</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">{pagesCount}</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/pages"
        >
          Gérer les pages →
        </Link>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Commandes</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">{ordersCount}</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/orders"
        >
          Voir les commandes →
        </Link>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Report détaillé</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">
          {paidOrdersCount}
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          Paiements payés (CA:{" "}
          {paidRevenueXof.toLocaleString("fr-FR")} FCFA)
        </p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/report"
        >
          Ouvrir le report →
        </Link>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Zones de livraison</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">{zonesCount}</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/delivery-zones"
        >
          Frais et zones →
        </Link>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Utilisateurs</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">{usersCount}</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/users"
        >
          Gérer les comptes →
        </Link>
      </div>
      </div>
    </div>
  );
}

