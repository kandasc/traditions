import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AIAssistantWidget } from "@/components/AIAssistantWidget";
import type { ReactNode } from "react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </div>
      <SiteFooter />
      <AIAssistantWidget />
    </>
  );
}

