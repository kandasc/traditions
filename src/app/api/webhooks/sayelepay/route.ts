import { prisma } from "@/lib/db";
import { verifySayelepaySignatureOrThrow } from "@/lib/payments/sayelepay";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-sayelepay-signature");

  try {
    verifySayelepaySignatureOrThrow(raw, signature);
  } catch (e: any) {
    return Response.json(
      { error: "Invalid signature", details: e?.message ?? "signature" },
      { status: 401 },
    );
  }

  let payload: any = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { raw };
  }

  // Best-effort mapping; adjust once we have SayelePay webhook contract.
  const reference: string | undefined =
    payload?.reference ||
    payload?.transactionId ||
    payload?.data?.reference ||
    payload?.data?.transactionId;
  const statusRaw: string | undefined =
    payload?.status || payload?.paymentStatus || payload?.data?.status;

  if (!reference) {
    return Response.json({ ok: true }); // ignore unknown callbacks
  }

  const payment = await prisma.payment.findFirst({
    where: { provider: "SAYELEPAY", externalReference: reference },
  });
  if (!payment) {
    return Response.json({ ok: true });
  }

  const normalized = (statusRaw ?? "").toString().toLowerCase();
  const status =
    normalized.includes("success") || normalized.includes("paid")
      ? "SUCCEEDED"
      : normalized.includes("cancel")
        ? "CANCELLED"
        : normalized.includes("fail") || normalized.includes("error")
          ? "FAILED"
          : "PENDING";

  if (status === "SUCCEEDED") {
    // Decrement stock only on the transition into SUCCEEDED.
    const updateRes = await prisma.payment.updateMany({
      where: { id: payment.id, status: { not: "SUCCEEDED" } },
      data: { status: "SUCCEEDED", rawWebhookJson: raw },
    });

    if (updateRes.count > 0) {
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: { items: true },
      });

      if (order) {
        const variantIds = order.items
          .map((it) => it.variantId)
          .filter((x): x is string => typeof x === "string");

        if (variantIds.length > 0) {
          const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, stock: true },
          });
          const stockById = new Map(
            variants.map((v) => [v.id, v.stock] as const),
          );

          for (const it of order.items) {
            if (!it.variantId) continue;
            const cur = stockById.get(it.variantId);
            if (cur == null) continue; // null => unlimited
            const next = Math.max(0, cur - it.quantity);
            await prisma.productVariant.update({
              where: { id: it.variantId },
              data: { stock: next },
            });
          }
        }
      }

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
      });
    } else {
      // Already succeeded; refresh raw payload only.
      await prisma.payment.update({
        where: { id: payment.id },
        data: { rawWebhookJson: raw },
      });
    }
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status as any,
        rawWebhookJson: raw,
      },
    });

    if (status === "FAILED" || status === "CANCELLED") {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: status === "CANCELLED" ? "CANCELLED" : "FAILED" },
      });
    }
  }

  return Response.json({ ok: true });
}

