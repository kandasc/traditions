import crypto from "crypto";

/**
 * SayelePay REST API v1 — see https://www.sayelepay.com/api-docs
 * Hosted checkout uses SayeleGate SDK client-side with `client_secret` from POST /payment-intents
 * — see https://www.sayelepay.com/sdk
 */

export type SayelePayInitRequest = {
  amountXof: number;
  reference: string;
  returnUrl: string;
  /** Per SayelePay docs — hosted checkout uses this when the user abandons payment */
  cancelUrl?: string;
  webhookUrl: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
};

export type SayelePayInitResult = {
  /** Present only if the API returns a direct redirect URL. */
  checkoutUrl: string | null;
  /** Present for standard PaymentIntent flow — use with SayeleGateSDK.redirectToCheckout */
  clientSecret?: string;
  externalReference?: string;
  raw: unknown;
};

function mustEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env ${key}`);
  return v;
}

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

/** Not hosted checkout links — echo of our redirect targets from the API */
const CHECKOUT_URL_IGNORE_KEYS = new Set([
  "return_url",
  "cancel_url",
  "success_url",
  "returnUrl",
  "cancelUrl",
  "successUrl",
]);

function sameUrlPath(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.origin === ub.origin && ua.pathname === ub.pathname;
  } catch {
    return false;
  }
}

/**
 * SayelePay often echoes `return_url` / `cancel_url` in the JSON. A naive scan of
 * all string URLs treated the success URL as “checkout” and skipped SayelePay entirely.
 */
function stripEchoRedirectUrls(
  url: string | null,
  req: SayelePayInitRequest,
): string | null {
  if (!url) return null;
  if (sameUrlPath(url, req.returnUrl)) return null;
  if (req.cancelUrl && sameUrlPath(url, req.cancelUrl)) return null;
  return url;
}

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
    if (CHECKOUT_URL_IGNORE_KEYS.has(key)) continue;
    const v = obj[key];
    if (typeof v === "string" && isHttpUrl(v)) return v.trim();
  }

  for (const nest of ["data", "result", "body", "payload", "response", "payment"]) {
    const inner = obj[nest];
    const found = extractCheckoutUrlFromResponse(inner);
    if (found) return found;
  }

  for (const [key, v] of Object.entries(obj)) {
    if (CHECKOUT_URL_IGNORE_KEYS.has(key)) continue;
    if (typeof v === "string" && isHttpUrl(v)) return v.trim();
    if (v && typeof v === "object") {
      const found = extractCheckoutUrlFromResponse(v);
      if (found) return found;
    }
  }

  return null;
}

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

export function extractClientSecret(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const pick = (obj: Record<string, unknown>): string | null => {
    for (const key of ["client_secret", "clientSecret"] as const) {
      const v = obj[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };
  const top = pick(o);
  if (top) return top;
  const d = o.data;
  if (d && typeof d === "object") {
    const inner = pick(d as Record<string, unknown>);
    if (inner) return inner;
  }
  const pi = o.payment_intent;
  if (pi && typeof pi === "object") {
    const inner = pick(pi as Record<string, unknown>);
    if (inner) return inner;
  }
  return null;
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

function buildPaymentIntentPayload(req: SayelePayInitRequest): Record<string, unknown> {
  let paymentMethodTypes: string[] = ["card", "mobile_money"];
  const rawTypes = process.env.SAYELEPAY_PAYMENT_METHOD_TYPES?.trim();
  if (rawTypes) {
    try {
      const parsed = JSON.parse(rawTypes) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        paymentMethodTypes = parsed as string[];
      }
    } catch {
      /* keep default */
    }
  }

  const payload: Record<string, unknown> = {
    amount: req.amountXof,
    currency: "XOF",
    payment_method_types: paymentMethodTypes,
    description: req.description ?? `Paiement ${req.reference}`,
    return_url: req.returnUrl,
  };

  if (req.cancelUrl) {
    payload.cancel_url = req.cancelUrl;
  }

  if (req.customerEmail) {
    payload.customer_email = req.customerEmail;
  }

  if (req.customerName) {
    payload.customer_name = req.customerName;
  }

  const merchantId = process.env.SAYELEPAY_MERCHANT_ID?.trim();
  if (merchantId) {
    payload.merchant_id = merchantId;
  }

  if (req.webhookUrl) {
    payload.callback_url = req.webhookUrl;
  }

  payload.metadata = { reference: req.reference };

  return payload;
}

/**
 * POST /payment-intents — request shape per https://www.sayelepay.com/api-docs
 */
export async function sayelepayInit(
  req: SayelePayInitRequest,
): Promise<SayelePayInitResult> {
  const base = mustEnv("SAYELEPAY_API_BASE").replace(/\/$/, "");
  const pathOrUrl =
    process.env.SAYELEPAY_INIT_PATH ?? "/payment-intents";
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

  const apiKey = mustEnv("SAYELEPAY_API_KEY");
  const payload = buildPaymentIntentPayload(req);

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

  const clientSecret = extractClientSecret(raw);

  let checkoutUrl =
    extractCheckoutUrlFromResponse(raw) ??
    extractStripeNextActionUrl(raw) ??
    buildHostedCheckoutFromTemplate(raw, req.reference);

  checkoutUrl = stripEchoRedirectUrls(checkoutUrl, req);

  if (!checkoutUrl && !clientSecret) {
    const hint = summarizeJsonKeys(raw);
    throw new Error(
      `SayelePay: réponse sans client_secret ni URL (aperçu ${hint}). ` +
        `Vérifiez la clé secrète et l’URL d’init (doc: https://www.sayelepay.com/api-docs).`,
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
    piId;

  return {
    checkoutUrl: checkoutUrl ?? null,
    clientSecret: clientSecret ?? undefined,
    externalReference:
      typeof externalReference === "string" ? externalReference : undefined,
    raw,
  };
}

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
