/**
 * Browser-side SayeleGate SDK (see https://www.sayelepay.com/sdk).
 * Loaded dynamically so the storefront bundle does not depend on remote script at build time.
 */

const SDK_SRC = "https://sdk.sayelepay.com/sayelegate-sdk.js";

export type SayeleGateCtor = new (publishableKey: string) => {
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
  const gate = new SayeleGateSDK(opts.publishableKey);
  gate.redirectToCheckout({
    clientSecret: opts.clientSecret,
    successUrl: opts.successUrl,
    cancelUrl: opts.cancelUrl,
  });
}
