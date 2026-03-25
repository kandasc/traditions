import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId } })
    : null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-8">
      <h1 className="text-2xl font-semibold text-zinc-950">
        Paiement reçu (en cours de confirmation)
      </h1>
      <p className="text-sm leading-7 text-zinc-700">
        Merci. Nous confirmons la commande dès validation du paiement.
      </p>
      {order ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <div>
            <span className="font-semibold text-zinc-950">Commande:</span>{" "}
            <span className="font-mono">{order.id}</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-950">Statut:</span>{" "}
            {order.status}
          </div>
        </div>
      ) : null}
      <div className="flex gap-3">
        <Link
          href="/shop"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Retour au shop
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}

