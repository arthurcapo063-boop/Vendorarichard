import type { ReactNode } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getSettings, publicSettings } from "@/lib/settings";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppWidget } from "@/components/whatsapp-widget";
import { CartDrawer } from "@/components/cart-drawer";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  const pub = publicSettings(s);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar settings={pub} categories={cats} />
      <main className="flex-1">{children}</main>
      <Footer settings={pub} categories={cats} />
      <WhatsAppWidget settings={pub} />
      <CartDrawer currency={pub.currency} siteName={pub.siteName} />
    </div>
  );
}
