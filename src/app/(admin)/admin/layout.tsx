import type { ReactNode } from "react";

/**
 * Parent layout for all /admin/* routes. Do not require auth here — `/admin/login`
 * must render without a session or you get ERR_TOO_MANY_REDIRECTS.
 * Protected chrome lives in `(dashboard)/layout.tsx`.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
