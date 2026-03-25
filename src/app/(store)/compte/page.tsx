import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

const statusFr: Record<string, string> = {
  PENDING: "En attente de paiement",
  PAID: "Payée",
  CANCELLED: "Annulée",
  FAILED: "Échouée",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/compte");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      items: { take: 3 },
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Mon compte</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {session.user.name ? (
            <>
              Bonjour, <span className="font-medium">{session.user.name}</span>{" "}
              ({session.user.email})
            </>
          ) : (
            session.user.email
          )}
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-950">Mes commandes</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Aucune commande pour le moment.{" "}
            <Link className="font-semibold underline" href="/shop">
              Découvrir la boutique
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/compte/commandes/${o.id}`}
                  className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-mono text-xs text-zinc-500">{o.id}</p>
                    <p className="text-sm font-semibold text-zinc-950">
                      {o.amountXof.toLocaleString("fr-FR")} FCFA
                    </p>
                    <p className="text-xs text-zinc-500">
                      {statusFr[o.status] ?? o.status} ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="mt-2 text-sm font-medium text-zinc-950 sm:mt-0">
                    Détails →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
