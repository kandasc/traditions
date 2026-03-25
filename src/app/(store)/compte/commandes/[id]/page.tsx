import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

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

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">
          Articles
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 text-sm border-b border-zinc-100 pb-3 last:border-0"
            >
              <div>
                <p className="font-medium text-zinc-950">{item.name}</p>
                <p className="text-zinc-600">× {item.quantity}</p>
                {item.metaJson ? (
                  <p className="text-xs text-zinc-500">{item.metaJson}</p>
                ) : null}
              </div>
              <p className="shrink-0 font-semibold text-zinc-950">
                {(item.unitPriceXof * item.quantity).toLocaleString("fr-FR")}{" "}
                FCFA
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-right text-lg font-semibold text-zinc-950">
          Total : {order.amountXof.toLocaleString("fr-FR")} FCFA
        </p>
      </section>

      {order.payments[0]?.checkoutUrl && order.status === "PENDING" ? (
        <a
          href={order.payments[0].checkoutUrl}
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Reprendre le paiement SayelePay
        </a>
      ) : null}
    </div>
  );
}
