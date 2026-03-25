import { prisma } from "@/lib/db";
import { sayelepayInit } from "@/lib/payments/sayelepay";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    productId?: string;
    quantity?: number;
    customerEmail?: string;
    customerName?: string;
  };

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

  const amountXof = product.priceXof * quantity;
  const reference = `TRD-${nanoid(10)}`;

  const order = await prisma.order.create({
    data: {
      status: "PENDING",
      currency: "XOF",
      amountXof,
      customerEmail: body.customerEmail?.toString() || null,
      customerName: body.customerName?.toString() || null,
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
    customerEmail: order.customerEmail ?? undefined,
    customerName: order.customerName ?? undefined,
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

