import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traditions — Boutique",
  description: "Authenticité et traditions riment avec modernisme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
