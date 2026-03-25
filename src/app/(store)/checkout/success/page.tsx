import Link from "next/link";
import { prisma } from "@/lib/db";

const statusFr: Record<string, string> = {
  PENDING: "En attente de confirmation du paiement",
  PAID: "Payée — commande confirmée",
  CANCELLED: "Annulée",
  FAILED: "Paiement non abouti",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, userId: true },
      })
    : null;

  const statusLabel =
    order && statusFr[order.status]
      ? statusFr[order.status]
      : order?.status ?? "";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Merci pour votre commande
      </h1>
      <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        Votre paiement a bien été transmis. Nous finalisons la commande dès
        réception de la confirmation de SayelePay (en général quelques instants).
        Vous pouvez suivre l’évolution depuis votre compte une fois la commande
        associée.
      </p>
      {order ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
          <div className="flex flex-col gap-2">
            <div>
              <span className="font-semibold text-zinc-950 dark:text-zinc-100">
                Référence commande
              </span>
              <p className="mt-1 break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {order.id}
              </p>
            </div>
            <div>
              <span className="font-semibold text-zinc-950 dark:text-zinc-100">
                Statut
              </span>
              <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                {statusLabel}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {order?.userId ? (
          <Link
            href={`/compte/commandes/${order.id}`}
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Voir la commande
          </Link>
        ) : null}
        <Link
          href="/shop"
          className={`inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold ${
            order?.userId
              ? "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          }`}
        >
          Retour au shop
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}

