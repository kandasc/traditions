import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { extractClientSecret } from "@/lib/payments/sayelepay";
import { ResumeSayelePayButton } from "@/components/ResumeSayelePayButton";
import type { Payment } from "@prisma/client";

function canResumeSayeleSdk(p: Payment | undefined): boolean {
  if (!p?.rawInitResponseJson) return false;
  try {
    const raw = JSON.parse(p.rawInitResponseJson) as unknown;
    return !!extractClientSecret(raw);
  } catch {
    return false;
  }
}

const statusFr: Record<string, string> = {
  PENDING: "En attente de paiement",
  PAID: "Payée",
  CANCELLED: "Annulée",
  FAILED: "Échouée",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/compte");
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: true,
      deliveryZone: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) return notFound();

  return (
    <div className="flex flex-col gap-8">
      <Link className="text-sm text-zinc-600 hover:text-zinc-950" href="/compte">
        ← Mes commandes
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Commande</h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">{order.id}</p>
        <p className="mt-2 text-sm text-zinc-600">
          {statusFr[order.status] ?? order.status} ·{" "}
          {new Date(order.createdAt).toLocaleString("fr-FR")}
        </p>
      </div>

      {(order.customerPhone ||
        order.customerAddress ||
        order.deliveryZone) && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Livraison
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
            {order.deliveryZone ? (
              <li>
                <span className="text-zinc-600 dark:text-zinc-400">Zone :</span>{" "}
                {order.deliveryZone.name} (
                {order.deliveryFeeXof.toLocaleString("fr-FR")} FCFA)
              </li>
            ) : null}
            {order.customerPhone ? (
              <li>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Téléphone :
                </span>{" "}
                {order.customerPhone}
              </li>
            ) : null}
            {order.customerAddress ? (
              <li>
                <span className="text-zinc-600 dark:text-zinc-400">Adresse :</span>{" "}
                <span className="whitespace-pre-wrap">{order.customerAddress}</span>
              </li>
            ) : null}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Articles
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 text-sm border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">
                  {item.name}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">× {item.quantity}</p>
                {item.metaJson ? (
                  <p className="text-xs text-zinc-500">{item.metaJson}</p>
                ) : null}
              </div>
              <p className="shrink-0 font-semibold text-zinc-950 dark:text-zinc-50">
                {(item.unitPriceXof * item.quantity).toLocaleString("fr-FR")}{" "}
                FCFA
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-1 text-right text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            Sous-total articles :{" "}
            <span className="font-medium text-zinc-950 dark:text-zinc-50">
              {order.subtotalXof.toLocaleString("fr-FR")} FCFA
            </span>
          </p>
          {order.deliveryFeeXof > 0 ? (
            <p>
              Livraison :{" "}
              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                {order.deliveryFeeXof.toLocaleString("fr-FR")} FCFA
              </span>
            </p>
          ) : null}
          <p className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Total : {order.amountXof.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
      </section>

      {order.status === "PENDING" && order.payments[0] ? (
        order.payments[0].checkoutUrl ? (
          <a
            href={order.payments[0].checkoutUrl}
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Reprendre le paiement
          </a>
        ) : canResumeSayeleSdk(order.payments[0]) ? (
          <ResumeSayelePayButton orderId={order.id} />
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Paiement SayelePay sans lien direct. Contactez-nous ou refaites une
            commande si besoin.
          </p>
        )
      ) : null}
    </div>
  );
}
