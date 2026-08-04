import { getSettings } from "@/lib/settings";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const s = await getSettings();
  return <CheckoutClient currency={s.currency} siteName={s.siteName} whatsappNumber={s.whatsappNumber} />;
}
