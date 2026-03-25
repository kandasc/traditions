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

/** Keys providers often use for the customer redirect URL (ordered). */
const CHECKOUT_URL_KEYS = [
  "checkoutUrl",
  "checkout_url",
  "paymentUrl",
  "payment_url",
  "PaymentUrl",
  "authorization_url",
  "authorizationUrl",
  "redirectUrl",
  "redirect_url",
  "url",
  "link",
  "paymentLink",
  "payment_link",
  "hosted_url",
  "payUrl",
  "pay_url",
  "webUrl",
  "web_url",
  "invoiceUrl",
  "invoice_url",
];

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/**
 * Extract payment redirect URL from arbitrary JSON shapes (nested data/result/…).
 */
export function extractCheckoutUrlFromResponse(raw: unknown): string | null {
  if (typeof raw === "string") {
    const t = raw.trim();
    return isHttpUrl(t) ? t : null;
  }
  if (!raw || typeof raw !== "object") return null;

  const customKey = process.env.SAYELEPAY_RESPONSE_URL_KEY?.trim();
  if (customKey) {
    const v = getNested(raw as Record<string, unknown>, customKey);
    if (typeof v === "string" && isHttpUrl(v)) return v.trim();
  }

  const obj = raw as Record<string, unknown>;

  for (const key of CHECKOUT_URL_KEYS) {
    const v = obj[key];
    if (typeof v === "string" && isHttpUrl(v)) return v.trim();
  }

  for (const nest of ["data", "result", "body", "payload", "response", "payment"]) {
    const inner = obj[nest];
    const found = extractCheckoutUrlFromResponse(inner);
    if (found) return found;
  }

  for (const v of Object.values(obj)) {
    if (typeof v === "string" && isHttpUrl(v)) return v.trim();
    if (v && typeof v === "object") {
      const found = extractCheckoutUrlFromResponse(v);
      if (found) return found;
    }
  }

  return null;
}

/** Stripe-style PaymentIntent when payment requires redirect. */
function extractStripeNextActionUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const na = o.next_action;
  if (!na || typeof na !== "object") return null;
  const r = (na as Record<string, unknown>).redirect_to_url;
  if (!r || typeof r !== "object") return null;
  const u = (r as Record<string, unknown>).url;
  if (typeof u === "string" && isHttpUrl(u)) return u.trim();
  return null;
}

/**
 * When the API returns only a PaymentIntent (id + client_secret) and no URL,
 * build the customer URL from SAYELEPAY_HOSTED_CHECKOUT_TEMPLATE.
 * Placeholders: {id}, {payment_intent}, {client_secret} (URL-encoded),
 * {id_raw}, {client_secret_raw} (not encoded — use with care).
 */
function buildHostedCheckoutFromTemplate(
  raw: unknown,
  orderReference?: string,
): string | null {
  const tpl = process.env.SAYELEPAY_HOSTED_CHECKOUT_TEMPLATE?.trim();
  if (!tpl || !raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const clientSecret = typeof o.client_secret === "string" ? o.client_secret : "";
  const isPaymentIntent =
    o.object === "payment_intent" ||
    /^pi_/i.test(id) ||
    (Boolean(clientSecret) && Boolean(id));

  if (!isPaymentIntent || !id) return null;

  const ref = orderReference ?? "";
  const out = tpl
    .replace(/\{reference_raw\}/g, ref)
    .replace(/\{reference\}/g, encodeURIComponent(ref))
    .replace(/\{id_raw\}/g, id)
    .replace(/\{payment_intent_raw\}/g, id)
    .replace(/\{client_secret_raw\}/g, clientSecret)
    .replace(/\{id\}/g, encodeURIComponent(id))
    .replace(/\{payment_intent\}/g, encodeURIComponent(id))
    .replace(/\{client_secret\}/g, encodeURIComponent(clientSecret));

  return isHttpUrl(out) ? out : null;
}

function getNested(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function summarizeJsonKeys(raw: unknown, depth = 0): string {
  if (depth > 4 || raw == null) return String(raw);
  if (typeof raw !== "object") return typeof raw;
  if (Array.isArray(raw))
    return `array[len=${raw.length}]${raw[0] ? `{${summarizeJsonKeys(raw[0], depth + 1)}}` : ""}`;
  const keys = Object.keys(raw as object).slice(0, 25);
  return `{${keys.join(", ")}${Object.keys(raw as object).length > 25 ? ", …" : ""}}`;
}

/**
 * NOTE: Payload/response mapping may need tuning to SayelePay’s exact contract.
 * Set SAYELEPAY_RESPONSE_URL_KEY=dotted.path (e.g. data.link) if the URL lives in a fixed field.
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
    raw = JSON.parse(rawText) as unknown;
  } catch {
    raw = rawText;
  }

  if (!res.ok) {
    throw new Error(`SayelePay init failed: ${res.status} ${rawText.slice(0, 500)}`);
  }

  const checkoutUrl =
    extractCheckoutUrlFromResponse(raw) ??
    extractStripeNextActionUrl(raw) ??
    buildHostedCheckoutFromTemplate(raw, req.reference);

  if (!checkoutUrl) {
    const hint = summarizeJsonKeys(raw);
    throw new Error(
      `SayelePay: la réponse est un PaymentIntent sans URL publique (aperçu ${hint}). ` +
        `Ajoutez SAYELEPAY_HOSTED_CHECKOUT_TEMPLATE avec les placeholders {id} et optionnellement {client_secret} ` +
        `(URL indiquée par SayelePay pour ouvrir la page de paiement), ou utilisez un endpoint qui renvoie déjà une URL.`,
    );
  }

  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : undefined;

  const piId = typeof obj?.id === "string" ? obj.id : undefined;

  const externalReference =
    (typeof obj?.reference === "string" && obj.reference) ||
    (typeof obj?.transactionId === "string" && obj.transactionId) ||
    (obj?.data &&
      typeof obj.data === "object" &&
      typeof (obj.data as Record<string, unknown>).reference === "string" &&
      (obj.data as Record<string, unknown>).reference) ||
    (obj?.data &&
      typeof obj.data === "object" &&
      typeof (obj.data as Record<string, unknown>).transactionId === "string" &&
      (obj.data as Record<string, unknown>).transactionId) ||
    piId;

  return {
    checkoutUrl,
    externalReference:
      typeof externalReference === "string" ? externalReference : undefined,
    raw,
  };
}

/**
 * Webhook signature verification (placeholder).
 */
export function verifySayelepaySignatureOrThrow(
  bodyRaw: string,
  signatureHeader: string | null,
) {
  const secret = process.env.SAYELEPAY_SECRET;
  if (!secret) return;
  if (!signatureHeader) throw new Error("Missing signature");

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
