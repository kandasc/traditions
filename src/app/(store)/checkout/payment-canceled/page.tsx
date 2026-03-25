import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ResumeSayelePayButton } from "@/components/ResumeSayelePayButton";

export default async function PaymentCanceledPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const session = await getServerSession(authOptions);

  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          userId: true,
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              provider: true,
              checkoutUrl: true,
              rawInitResponseJson: true,
            },
          },
        },
      })
    : null;

  const p = order?.payments[0];
  const canPayPending =
    order?.status === "PENDING" &&
    p?.provider === "SAYELEPAY" &&
    p.status === "PENDING";

  const hostedUrl = p?.checkoutUrl?.trim() || null;

  const canUseSdkResume =
    !!order &&
    canPayPending &&
    !!p?.rawInitResponseJson &&
    (session?.user?.role === "admin" ||
      (order.userId != null && order.userId === session?.user?.id));

  const loginResumeUrl = orderId
    ? `/login?callbackUrl=${encodeURIComponent(`/checkout/payment-canceled?orderId=${orderId}`)}`
    : "/login";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Paiement annulé
      </h1>
      <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        Vous avez quitté la page de paiement SayelePay sans finaliser la
        transaction. Aucun prélèvement n’a été effectué sur cette étape. Si une
        commande a été créée, elle reste en attente de paiement.
      </p>
      {order ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
          <span className="font-semibold text-zinc-950 dark:text-zinc-100">
            Référence commande
          </span>
          <p className="mt-1 break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {order.id}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {canPayPending && hostedUrl ? (
          <a
            href={hostedUrl}
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Reprendre le paiement (lien SayelePay)
          </a>
        ) : null}

        {canPayPending && canUseSdkResume && order ? (
          <ResumeSayelePayButton
            orderId={order.id}
            cancelPath={`/checkout/payment-canceled?orderId=${encodeURIComponent(order.id)}`}
          >
            Reprendre le paiement
          </ResumeSayelePayButton>
        ) : null}

        {canPayPending && !hostedUrl && !canUseSdkResume ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Pour reprendre le paiement avec le même panier sécurisé,{" "}
            <Link href={loginResumeUrl} className="font-semibold underline">
              connectez-vous au compte utilisé pour la commande
            </Link>
            .
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {order?.userId ? (
            <Link
              href={`/compte/commandes/${order.id}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Voir la commande
            </Link>
          ) : null}
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
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
    </div>
  );
}
