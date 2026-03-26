import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  IconChart,
  IconCoin,
  IconPin,
  IconReceipt,
  IconTruck,
} from "@/components/admin-kpi-icons";

const statusFr: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  CANCELLED: "Annulée",
  FAILED: "Échouée",
};

function fmtXof(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export default async function AdminReportPage() {
  const rangeDays = 30;
  const since = new Date();
  since.setDate(since.getDate() - rangeDays);

  const [
    totalOrders,
    paidOrders,
    pendingOrders,
    cancelledOrders,
    failedOrders,
    paidRevenueAgg,
    deliveryFeeAgg,
    rangeOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.count({ where: { status: "FAILED" } }),
    prisma.order.aggregate({
      _sum: { amountXof: true },
      where: { status: "PAID" },
    }),
    prisma.order.aggregate({
      _sum: { deliveryFeeXof: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      take: 60,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        deliveryZone: true,
      },
    }),
  ]);

  const paidRevenueXof = paidRevenueAgg._sum.amountXof ?? 0;
  const deliveryFeeXof = deliveryFeeAgg._sum.deliveryFeeXof ?? 0;

  const rangeStats = rangeOrders.reduce(
    (acc, o) => {
      acc.total += 1;
      acc.byStatus[o.status] = (acc.byStatus[o.status] ?? 0) + 1;
      acc.deliveryFeeXof += o.deliveryFeeXof ?? 0;
      if (o.status === "PAID") acc.paidRevenueXof += o.amountXof;
      return acc;
    },
    {
      total: 0,
      paidRevenueXof: 0,
      deliveryFeeXof: 0,
      byStatus: {} as Record<string, number>,
    },
  );

  const zonesTop = (() => {
    const map = new Map<
      string,
      { zoneName: string; count: number; feeXof: number }
    >();
    for (const o of rangeOrders) {
      const id = o.deliveryZoneId ?? "unknown";
      const key = id;
      const zoneName = o.deliveryZone?.name ?? "—";
      const cur =
        map.get(key) ??
        ({ zoneName, count: 0, feeXof: 0 } as {
          zoneName: string;
          count: number;
          feeXof: number;
        });
      cur.count += 1;
      cur.feeXof += o.deliveryFeeXof ?? 0;
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([, v]) => v)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <IconChart className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">
            Rapport détaillé
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Indicateurs globaux + aperçu sur les {rangeDays} derniers jours.
          </p>
        </div>
      </div>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6">
          <IconReceipt className="absolute right-3 top-3 h-10 w-10 text-zinc-200" />
          <p className="text-sm text-zinc-600">Total commandes</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {totalOrders}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-emerald-50/50 p-6">
          <IconCoin className="absolute right-3 top-3 h-10 w-10 text-emerald-200" />
          <p className="text-sm text-zinc-600">CA encaissé (Payées)</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {paidRevenueXof.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-amber-50/50 p-6">
          <IconTruck className="absolute right-3 top-3 h-10 w-10 text-amber-200" />
          <p className="text-sm text-zinc-600">Frais livraison (toutes statuts)</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {deliveryFeeXof.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6">
          <IconChart className="absolute right-3 top-3 h-10 w-10 text-zinc-200" />
          <p className="text-sm text-zinc-600">Statut en cours</p>
          <p className="mt-2 text-sm text-zinc-700">
            {pendingOrders} en attente · {cancelledOrders} annulées ·{" "}
            {failedOrders} échouées
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            {paidOrders} payées
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="relative overflow-hidden lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6">
          <IconPin className="absolute right-4 top-4 h-8 w-8 text-zinc-200" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
            Top zones (période)
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {zonesTop.length === 0 ? (
              <p className="text-sm text-zinc-600">
                Pas de commandes dans cette période.
              </p>
            ) : (
              zonesTop.map((z) => (
                <div
                  key={z.zoneName}
                  className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">
                      {z.zoneName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {z.count} commandes
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-zinc-950">
                    {z.feeXof.toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
            Résumé {rangeDays} jours
          </h2>
          <div className="mt-4 space-y-2 text-sm text-zinc-700">
            <p>
              Total: <span className="font-semibold">{rangeStats.total}</span>{" "}
              commandes
            </p>
            <p>
              Payées:{" "}
              <span className="font-semibold">
                {rangeStats.byStatus.PAID ?? 0}
              </span>
            </p>
            <p>
              CA Payées:{" "}
              <span className="font-semibold text-zinc-950">
                {fmtXof(rangeStats.paidRevenueXof)}
              </span>
            </p>
            <p>
              Livraison:{" "}
              <span className="font-semibold text-zinc-950">
                {fmtXof(rangeStats.deliveryFeeXof)}
              </span>
            </p>
          </div>
          <div className="mt-5">
            <Link
              href="/admin/orders"
              className="inline-flex text-sm font-semibold text-zinc-950 hover:underline"
            >
              Voir toutes les commandes →
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Historique détaillé (derniers {rangeDays} jours)
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[52rem] table-fixed border-collapse text-left text-sm text-zinc-800">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                <th className="w-[18%] px-3 py-3 align-bottom">
                  Commande
                </th>
                <th className="w-[28%] px-3 py-3 align-bottom">Client</th>
                <th className="w-[22%] px-3 py-3 align-bottom">Zone</th>
                <th className="w-[8%] px-3 py-3 align-bottom">Liv.</th>
                <th className="w-[12%] px-3 py-3 align-bottom">Total</th>
                <th className="w-[12%] px-3 py-3 align-bottom">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rangeOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-sm text-zinc-600">
                    Aucune commande pour cette période.
                  </td>
                </tr>
              ) : (
                rangeOrders.map((o) => (
                  <tr key={o.id} className="align-top">
                    <td className="max-w-0 px-3 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="break-all font-mono text-xs leading-snug text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-950"
                      >
                        {o.id}
                      </Link>
                    </td>
                    <td className="max-w-0 px-3 py-3">
                      <span className="break-words [overflow-wrap:anywhere] leading-snug">
                        {o.user?.email ?? o.customerEmail ?? "Invité"}
                      </span>
                    </td>
                    <td className="max-w-0 px-3 py-3 break-words leading-snug text-zinc-700">
                      {o.deliveryZone?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3 font-semibold text-zinc-950 whitespace-nowrap">
                      {o.deliveryFeeXof.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-3 font-semibold text-zinc-950 whitespace-nowrap">
                      {o.amountXof.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-3 break-words leading-snug">
                      {statusFr[o.status] ?? o.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
