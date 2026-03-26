import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  IconBox,
  IconChart,
  IconFile,
  IconReceipt,
  IconTruck,
  IconUsers,
} from "@/components/admin-kpi-icons";

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
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6">
        <IconBox className="absolute right-3 top-3 h-10 w-10 text-zinc-200" />
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
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6">
        <IconFile className="absolute right-3 top-3 h-10 w-10 text-zinc-200" />
        <p className="text-sm text-zinc-600">Pages</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">{pagesCount}</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/pages"
        >
          Gérer les pages →
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6">
        <IconFile className="absolute right-3 top-3 h-10 w-10 text-zinc-200" />
        <p className="text-sm text-zinc-600">Catégories</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">—</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/categories"
        >
          Gérer les catégories →
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6">
        <IconReceipt className="absolute right-3 top-3 h-10 w-10 text-zinc-200" />
        <p className="text-sm text-zinc-600">Commandes</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">{ordersCount}</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/orders"
        >
          Voir les commandes →
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-violet-50/60 p-6">
        <IconChart className="absolute right-3 top-3 h-10 w-10 text-violet-200" />
        <p className="text-sm text-zinc-600">Rapport détaillé</p>
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
          Ouvrir le rapport →
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6">
        <IconTruck className="absolute right-3 top-3 h-10 w-10 text-zinc-200" />
        <p className="text-sm text-zinc-600">Zones de livraison</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">{zonesCount}</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/delivery-zones"
        >
          Frais et zones →
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6">
        <IconUsers className="absolute right-3 top-3 h-10 w-10 text-zinc-200" />
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

