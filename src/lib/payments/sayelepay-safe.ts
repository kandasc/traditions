import { sayelepayInit } from "./sayelepay";
import type { SayelePayInitRequest } from "./sayelepay";

export type InitPaymentResult =
  | {
      ok: true;
      checkoutUrl: string | null;
      clientSecret?: string;
      externalReference?: string;
      raw: unknown;
    }
  | { ok: false; message: string };

function missingEnvHint(): string {
  const need = [
    "SAYELEPAY_API_BASE",
    "SAYELEPAY_API_KEY",
  ].filter((k) => !process.env[k]);
  if (need.length === 0) {
    return "Le fournisseur de paiement a refusé la demande ou la réponse est invalide.";
  }
  return `Configuration paiement incomplète (manque : ${need.join(", ")}).`;
}

/**
 * Never throws: returns { ok: false, message } for client-facing errors.
 */
export async function sayelepayInitSafe(
  req: SayelePayInitRequest,
): Promise<InitPaymentResult> {
  try {
    const result = await sayelepayInit(req);
    return {
      ok: true,
      checkoutUrl: result.checkoutUrl,
      clientSecret: result.clientSecret,
      externalReference: result.externalReference,
      raw: result.raw,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("Missing env")) {
      return { ok: false, message: missingEnvHint() };
    }
    return { ok: false, message: msg || missingEnvHint() };
  }
}
