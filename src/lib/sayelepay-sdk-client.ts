/**
 * Browser-side SayeleGate SDK (see https://www.sayelepay.com/sdk).
 * Loaded dynamically so the storefront bundle does not depend on remote script at build time.
 *
 * Important: SayeleGateSDK defaults `baseUrl` to `window.location.origin`, so `redirectToCheckout`
 * would send users to YOUR site at `/checkout` instead of SayelePay. Always pass SayelePay’s
 * gateway origin via the second constructor argument (see SDK source on sdk.sayelepay.com).
 */

const SDK_SRC = "https://sdk.sayelepay.com/sayelegate-sdk.js";

/** Origin only, no path — SDK appends `/checkout?...`. */
export function sayelePayGateOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SAYELEPAY_GATE_ORIGIN?.trim() ||
    "https://api.sayelepay.com";
  return raw.replace(/\/$/, "");
}

export type SayeleGateCtor = new (
  publishableKey: string,
  options?: { baseUrl?: string },
) => {
  redirectToCheckout: (opts: {
    clientSecret: string;
    successUrl: string;
    cancelUrl?: string;
  }) => void;
};

function getSayeleGate(): SayeleGateCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { SayeleGateSDK?: SayeleGateCtor }).SayeleGateSDK;
}

export function loadSayeleGateSdk(): Promise<SayeleGateCtor> {
  return new Promise((resolve, reject) => {
    const existing = getSayeleGate();
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.onload = () => {
      const Ctor = getSayeleGate();
      if (!Ctor) {
        reject(new Error("SayeleGateSDK absent après chargement du script"));
        return;
      }
      resolve(Ctor);
    };
    script.onerror = () =>
      reject(new Error("Impossible de charger le SDK SayelePay"));
    document.head.appendChild(script);
  });
}

export async function redirectToSayelePayCheckout(opts: {
  publishableKey: string;
  clientSecret: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const SayeleGateSDK = await loadSayeleGateSdk();
  const gate = new SayeleGateSDK(opts.publishableKey, {
    baseUrl: sayelePayGateOrigin(),
  });
  gate.redirectToCheckout({
    clientSecret: opts.clientSecret,
    successUrl: opts.successUrl,
    cancelUrl: opts.cancelUrl,
  });
}
