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

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: status as any,
      rawWebhookJson: raw,
    },
  });

  if (status === "SUCCEEDED") {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" },
    });
  } else if (status === "FAILED" || status === "CANCELLED") {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: status === "CANCELLED" ? "CANCELLED" : "FAILED" },
    });
  }

  return Response.json({ ok: true });
}

