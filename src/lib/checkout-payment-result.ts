/**
 * SayelePay / hosted checkout may append query params on redirect; values vary by provider version.
 */
export function isPaymentCanceledSearchParams(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const raw = (k: string) => {
    const v = params[k];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const truthy = (s: string | undefined) =>
    s === "1" ||
    s === "true" ||
    s?.toLowerCase() === "yes";

  if (truthy(raw("canceled")) || truthy(raw("cancelled"))) return true;
  if (truthy(raw("cancel"))) return true;

  const status = raw("status")?.toLowerCase();
  if (
    status === "canceled" ||
    status === "cancelled" ||
    status === "cancel"
  ) {
    return true;
  }

  const ps = raw("payment_status")?.toLowerCase();
  if (ps === "canceled" || ps === "cancelled") return true;

  const rs = raw("redirect_status")?.toLowerCase();
  if (rs === "canceled" || rs === "cancelled") return true;

  return false;
}
