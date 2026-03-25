import { prisma } from "@/lib/db";
import { sayelepayInit } from "@/lib/payments/sayelepay";
import {
  clearGuestCartCookie,
  emptyCartById,
  getValidatedCartLinesForCheckout,
} from "@/lib/cart";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    productId?: string;
    quantity?: number;
    customerEmail?: string;
    customerName?: string;
    fromCart?: boolean;
  };

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  let customerEmail = body.customerEmail?.toString().trim() || null;
  let customerName = body.customerName?.toString().trim() || null;
  if (session?.user?.email) customerEmail = session.user.email;
  if (session?.user?.name) customerName = session.user.name;

  if (body.fromCart) {
    const cartCheckout = await getValidatedCartLinesForCheckout();
    if (!cartCheckout || cartCheckout.lines.length === 0) {
      return Response.json({ error: "Panier vide" }, { status: 400 });
    }

    if (!customerEmail) {
      return Response.json(
        { error: "Email requis pour la commande" },
        { status: 400 },
      );
    }

    const amountXof = cartCheckout.subtotalXof;
    const reference = `TRD-${nanoid(10)}`;

    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        currency: "XOF",
        amountXof,
        customerEmail,
        customerName,
        userId: sessionUserId ?? undefined,
        items: {
          create: cartCheckout.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            name: line.name,
            quantity: line.quantity,
            unitPriceXof: line.unitPriceXof,
            metaJson: line.metaJson,
          })),
        },
      },
    });

    await emptyCartById(cartCheckout.cartId);
    if (cartCheckout.guestToken) {
      await clearGuestCartCookie();
    }

    const origin = new URL(req.url).origin;
    const returnUrl = `${origin}/checkout/success?orderId=${order.id}`;
    const webhookUrl = `${origin}/api/webhooks/sayelepay`;

    const descNames = cartCheckout.lines.map((l) => l.name).join(", ");
    const init = await sayelepayInit({
      amountXof,
      reference,
      returnUrl,
      webhookUrl,
      customerEmail: customerEmail ?? undefined,
      customerName: customerName ?? undefined,
      description: `Commande ${order.id} — ${descNames.slice(0, 120)}`,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "SAYELEPAY",
        status: "PENDING",
        amountXof,
        currency: "XOF",
        externalReference: init.externalReference ?? reference,
        checkoutUrl: init.checkoutUrl,
        rawInitResponseJson: JSON.stringify(init.raw),
      },
    });

    return Response.json({
      orderId: order.id,
      checkoutUrl: init.checkoutUrl,
    });
  }

  const productId = body.productId?.toString();
  const quantity = Math.max(1, Number(body.quantity ?? 1) || 1);
  if (!productId) {
    return Response.json({ error: "Missing productId" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product || !product.isActive || !product.priceXof) {
    return Response.json({ error: "Product not purchasable" }, { status: 400 });
  }

  if (!customerEmail) {
    return Response.json(
      { error: "Email requis pour la commande" },
      { status: 400 },
    );
  }

  const amountXof = product.priceXof * quantity;
  const reference = `TRD-${nanoid(10)}`;

  const order = await prisma.order.create({
    data: {
      status: "PENDING",
      currency: "XOF",
      amountXof,
      customerEmail,
      customerName,
      userId: sessionUserId ?? undefined,
      items: {
        create: [
          {
            productId: product.id,
            name: product.name,
            quantity,
            unitPriceXof: product.priceXof,
          },
        ],
      },
    },
  });

  const origin = new URL(req.url).origin;
  const returnUrl = `${origin}/checkout/success?orderId=${order.id}`;
  const webhookUrl = `${origin}/api/webhooks/sayelepay`;

  const init = await sayelepayInit({
    amountXof,
    reference,
    returnUrl,
    webhookUrl,
    customerEmail: customerEmail ?? undefined,
    customerName: customerName ?? undefined,
    description: `Commande ${order.id} — ${product.name}`,
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "SAYELEPAY",
      status: "PENDING",
      amountXof,
      currency: "XOF",
      externalReference: init.externalReference ?? reference,
      checkoutUrl: init.checkoutUrl,
      rawInitResponseJson: JSON.stringify(init.raw),
    },
  });

  return Response.json({
    orderId: order.id,
    checkoutUrl: init.checkoutUrl,
  });
}
