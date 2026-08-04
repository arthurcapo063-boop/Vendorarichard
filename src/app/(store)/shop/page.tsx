import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { ShopClient } from "./shop-client";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const s = await getSettings();
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  return (
    <Suspense fallback={<div className="container-x py-24 text-center text-mute">Loading the market…</div>}>
      <ShopClient
        currency={s.currency}
        showSoldOut={s.showSoldOut}
        categories={cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      />
    </Suspense>
  );
}
