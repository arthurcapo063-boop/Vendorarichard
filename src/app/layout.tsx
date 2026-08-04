import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { StoreProvider } from "@/components/providers";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('vd-theme');var dark=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const s = await getSettings();
    return {
      title: { default: `${s.siteName} — ${s.tagline}`, template: `%s · ${s.siteName}` },
      description: `${s.siteName}: ${s.tagline}. Cars, clothing, watches, shoes, sneakers and building materials with wallet payments and Paystack-secured checkout.`,
    };
  } catch {
    return { title: "Vendora" };
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  const brandVars = {
    "--brand": s.primaryColor,
    "--brand-2": s.secondaryColor,
  } as CSSProperties;

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} style={brandVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-paper font-sans text-ink antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
