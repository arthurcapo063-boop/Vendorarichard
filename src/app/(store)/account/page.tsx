import { Suspense } from "react";
import { getSettings } from "@/lib/settings";
import { AccountClient } from "./account-client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const s = await getSettings();
  return (
    <Suspense fallback={<div className="container-x py-24 text-center text-mute">Loading your dashboard…</div>}>
      <AccountClient currency={s.currency} siteName={s.siteName} />
    </Suspense>
  );
}
