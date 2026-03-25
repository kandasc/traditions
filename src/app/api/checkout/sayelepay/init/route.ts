import { prisma } from "@/lib/db";
import { sayelepayInitSafe } from "@/lib/payments/sayelepay-safe";
import {
  clearGuestCartCookie,
  emptyCartById,
  getValidatedCartLinesForCheckout,
} from "@/lib/cart";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { nanoid } from "nanoid";
import {
  normalizeCustomerAddress,
  normalizeCustomerPhone,
  resolveActiveDeliveryZone,
  validateCheckoutShipping,
} from "@/lib/checkout-shipping";

export async function POST(req: Request) {
  let body: {
    productId?: string;
    quantity?: number;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    deliveryZoneId?: string;
    fromCart?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  let customerEmail = body.customerEmail?.toString().trim() || null;
  let customerName = body.customerName?.toString().trim() || null;
  if (session?.user?.email) customerEmail = session.user.email;
  if (session?.user?.name) customerName = session.user.name;

  const customerPhone = normalizeCustomerPhone(body.customerPhone);
  const customerAddress = normalizeCustomerAddress(body.customerAddress);
  const shipCheck = validateCheckoutShipping(customerPhone, customerAddress);
  if (!("ok" in shipCheck)) {
    return Response.json({ error: shipCheck.error }, { status: 400 });
  }

  const zoneRes = await resolveActiveDeliveryZone(body.deliveryZoneId);
  if ("error" in zoneRes) {
    return Response.json({ error: zoneRes.error }, { status: 400 });
  }
  const { zone } = zoneRes;
  const deliveryFeeXof = zone.feeXof;

  const origin = new URL(req.url).origin;

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

    const subtotalXof = cartCheckout.subtotalXof;
    const amountXof = subtotalXof + deliveryFeeXof;
    const reference = `TRD-${nanoid(10)}`;
    const returnUrl = `${origin}/checkout/success?orderId=`;
    const webhookUrl = `${origin}/api/webhooks/sayelepay`;
    const descNames = cartCheckout.lines.map((l) => l.name).join(", ");

    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        currency: "XOF",
        subtotalXof,
        deliveryFeeXof,
        amountXof,
        customerEmail,
        customerName,
        customerPhone,
        customerAddress,
        deliveryZoneId: zone.id,
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

    const init = await sayelepayInitSafe({
      amountXof,
      reference,
      returnUrl: `${returnUrl}${order.id}`,
      webhookUrl,
      customerEmail: customerEmail ?? undefined,
      customerName: customerName ?? undefined,
      description: `Commande ${order.id} — ${descNames.slice(0, 120)}`,
    });

    if (!init.ok) {
      await prisma.order.delete({ where: { id: order.id } });
      return Response.json({ error: init.message }, { status: 502 });
    }

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

    await emptyCartById(cartCheckout.cartId);
    if (cartCheckout.guestToken) {
      await clearGuestCartCookie();
    }

    return Response.json({
      orderId: order.id,
      checkoutUrl: init.checkoutUrl ?? undefined,
      clientSecret: init.clientSecret,
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

  const subtotalXof = product.priceXof * quantity;
  const amountXof = subtotalXof + deliveryFeeXof;
  const reference = `TRD-${nanoid(10)}`;

  const order = await prisma.order.create({
    data: {
      status: "PENDING",
      currency: "XOF",
      subtotalXof,
      deliveryFeeXof,
      amountXof,
      customerEmail,
      customerName,
      customerPhone,
      customerAddress,
      deliveryZoneId: zone.id,
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

  const returnUrl = `${origin}/checkout/success?orderId=${order.id}`;
  const webhookUrl = `${origin}/api/webhooks/sayelepay`;

  const init = await sayelepayInitSafe({
    amountXof,
    reference,
    returnUrl,
    webhookUrl,
    customerEmail: customerEmail ?? undefined,
    customerName: customerName ?? undefined,
    description: `Commande ${order.id} — ${product.name}`,
  });

  if (!init.ok) {
    await prisma.order.delete({ where: { id: order.id } });
    return Response.json({ error: init.message }, { status: 502 });
  }

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
    checkoutUrl: init.checkoutUrl ?? undefined,
    clientSecret: init.clientSecret,
  });
}
