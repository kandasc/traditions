import crypto from "crypto";

export type SayelePayInitRequest = {
  amountXof: number;
  reference: string;
  returnUrl: string;
  webhookUrl: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
};

export type SayelePayInitResult = {
  checkoutUrl: string;
  externalReference?: string;
  raw: unknown;
};

function mustEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env ${key}`);
  return v;
}

/**
 * NOTE:
 * SayelePay public docs weren’t discoverable. This adapter is intentionally
 * isolated so we can map it to the exact contract once you share credentials/docs.
 */
export async function sayelepayInit(
  req: SayelePayInitRequest,
): Promise<SayelePayInitResult> {
  const base = mustEnv("SAYELEPAY_API_BASE").replace(/\/$/, "");
  const pathOrUrl = process.env.SAYELEPAY_INIT_PATH ?? "/api/payments/init";
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

  const apiKey = mustEnv("SAYELEPAY_API_KEY");
  const merchantId = process.env.SAYELEPAY_MERCHANT_ID;

  // Generic payload (we’ll adjust keys to SayelePay’s exact API)
  const payload: Record<string, unknown> = {
    merchantId,
    amount: req.amountXof,
    currency: "XOF",
    reference: req.reference,
    returnUrl: req.returnUrl,
    callbackUrl: req.webhookUrl,
    customerEmail: req.customerEmail,
    customerName: req.customerName,
    description: req.description,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();
  let raw: unknown = rawText;
  try {
    raw = JSON.parse(rawText);
  } catch {
    // keep raw as text
  }

  if (!res.ok) {
    throw new Error(`SayelePay init failed: ${res.status} ${rawText}`);
  }

  // Best-effort extraction; we’ll replace with exact fields.
  const checkoutUrl =
    (raw as any)?.checkoutUrl ||
    (raw as any)?.paymentUrl ||
    (raw as any)?.data?.checkoutUrl ||
    (raw as any)?.data?.paymentUrl;

  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    throw new Error("SayelePay init: missing checkoutUrl in response");
  }

  const externalReference =
    (raw as any)?.reference ||
    (raw as any)?.transactionId ||
    (raw as any)?.data?.reference ||
    (raw as any)?.data?.transactionId;

  return {
    checkoutUrl,
    externalReference:
      typeof externalReference === "string" ? externalReference : undefined,
    raw,
  };
}

/**
 * Webhook signature verification (placeholder).
 * Once you share how SayelePay signs callbacks (header names + algorithm),
 * we’ll implement the exact check here.
 */
export function verifySayelepaySignatureOrThrow(
  bodyRaw: string,
  signatureHeader: string | null,
) {
  const secret = process.env.SAYELEPAY_SECRET;
  if (!secret) return; // allow dev without signature
  if (!signatureHeader) throw new Error("Missing signature");

  // Default guess: HMAC-SHA256 hex of raw body
  const expected = crypto
    .createHmac("sha256", secret)
    .update(bodyRaw, "utf8")
    .digest("hex");

  const ok = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader),
  );
  if (!ok) throw new Error("Invalid signature");
}

