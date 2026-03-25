import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractClientSecret } from "@/lib/payments/sayelepay";

export async function POST(req: Request) {
  let body: { orderId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const orderId = body.orderId?.toString().trim();
  if (!orderId) {
    return Response.json({ error: "orderId requis" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order) {
    return Response.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.status !== "PENDING") {
    return Response.json(
      { error: "Cette commande n’est pas en attente de paiement" },
      { status: 400 },
    );
  }

  if (!isAdmin && order.userId !== session.user.id) {
    return Response.json({ error: "Accès refusé" }, { status: 403 });
  }

  const payment = order.payments[0];
  if (!payment || payment.provider !== "SAYELEPAY") {
    return Response.json({ error: "Aucun paiement SayelePay" }, { status: 400 });
  }

  if (payment.status !== "PENDING") {
    return Response.json(
      { error: "Le paiement n’est plus en attente" },
      { status: 400 },
    );
  }

  if (!payment.rawInitResponseJson) {
    return Response.json(
      { error: "Données de paiement indisponibles" },
      { status: 404 },
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(payment.rawInitResponseJson) as unknown;
  } catch {
    return Response.json({ error: "Données de paiement invalides" }, { status: 500 });
  }

  const clientSecret = extractClientSecret(raw);
  if (!clientSecret) {
    return Response.json(
      { error: "client_secret introuvable — nouvelle tentative de paiement requise" },
      { status: 404 },
    );
  }

  return Response.json({ orderId: order.id, clientSecret });
}
