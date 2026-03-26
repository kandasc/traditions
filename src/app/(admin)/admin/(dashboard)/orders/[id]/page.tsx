import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      deliveryZone: true,
      payments: { orderBy: { createdAt: "desc" } },
      user: { select: { email: true, name: true, id: true } },
    },
  });
  if (!order) return notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Link className="text-sm text-zinc-600 hover:text-zinc-950" href="/admin/orders">
        ← Toutes les commandes
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Commande</h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">{order.id}</p>
        <p className="mt-2 text-sm text-zinc-600">
          {statusFr[order.status] ?? order.status} ·{" "}
          {new Date(order.createdAt).toLocaleString("fr-FR")}
        </p>
        {order.user ? (
          <p className="mt-2 text-sm text-zinc-700">
            Compte : {order.user.email} {order.user.name ? `(${order.user.name})` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-700">
            Invité : {order.customerEmail} {order.customerName ? `— ${order.customerName}` : ""}
          </p>
        )}
      </div>

      {(order.customerPhone ||
        order.customerAddress ||
        order.deliveryZone) && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
            Livraison
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-800">
            {order.deliveryZone ? (
              <li>
                <span className="text-zinc-600">Zone :</span>{" "}
                {order.deliveryZone.name} (
                {order.deliveryFeeXof.toLocaleString("fr-FR")} FCFA)
              </li>
            ) : null}
            {order.customerPhone ? (
              <li>
                <span className="text-zinc-600">Téléphone :</span>{" "}
                {order.customerPhone}
              </li>
            ) : null}
            {order.customerAddress ? (
              <li>
                <span className="text-zinc-600">Adresse :</span>{" "}
                <span className="whitespace-pre-wrap">{order.customerAddress}</span>
              </li>
            ) : null}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Lignes
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 border-b border-zinc-100 pb-3 text-sm last:border-0"
            >
              <div>
                <p className="font-medium text-zinc-950">{item.name}</p>
                <p className="text-zinc-600">× {item.quantity}</p>
                {item.metaJson ? (
                  <p className="text-xs text-zinc-500">{item.metaJson}</p>
                ) : null}
              </div>
              <p className="shrink-0 font-semibold">
                {(item.unitPriceXof * item.quantity).toLocaleString("fr-FR")} FCFA
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-1 text-right text-sm text-zinc-700">
          <p>
            Sous-total articles :{" "}
            <span className="font-medium text-zinc-950">
              {order.subtotalXof.toLocaleString("fr-FR")} FCFA
            </span>
          </p>
          {order.deliveryFeeXof > 0 ? (
            <p>
              Livraison :{" "}
              <span className="font-medium text-zinc-950">
                {order.deliveryFeeXof.toLocaleString("fr-FR")} FCFA
              </span>
            </p>
          ) : null}
          <p className="text-lg font-semibold text-zinc-950">
            Total : {order.amountXof.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Paiements
        </h2>
        <ul className="mt-3 text-sm text-zinc-700">
          {order.payments.map((p) => (
            <li key={p.id} className="border-b border-zinc-100 py-2 last:border-0">
              {p.provider} — {p.status} —{" "}
              {p.amountXof.toLocaleString("fr-FR")} FCFA
              {order.status === "PENDING" && p.status === "PENDING" ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {p.checkoutUrl ? (
                    <a
                      className="text-xs font-semibold underline"
                      href={p.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Lien de paiement
                    </a>
                  ) : canResumeSayeleSdk(p) ? (
                    <ResumeSayelePayButton
                      orderId={order.id}
                      cancelPath={`/admin/orders/${order.id}`}
                      className="inline-flex h-8 items-center rounded-lg bg-zinc-950 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                    >
                      Envoyer le lien de paiement (au client)
                    </ResumeSayelePayButton>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
