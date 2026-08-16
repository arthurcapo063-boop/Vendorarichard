import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { initPaystack } from "@/lib/paystack";
import { err, json, HttpError, num } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const amount = Math.floor(num(body.amount));
    if (amount < 500) throw new HttpError(400, "Minimum top-up is GH₵500.");
    if (amount > 10_000_000) throw new HttpError(400, "Maximum top-up is GH₵10,000,000.");

    const h = await headers();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      h.get("origin") ??
      (h.get("host") ? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}` : new URL(req.url).origin);
    const init = await initPaystack({
      email: user.email,
      amountNaira: amount,
      type: "wallet",
      targetId: user.id,
      callbackPath: "/api/paystack/callback",
      origin,
    });

    return json({ redirectUrl: init.authorizationUrl, demo: init.demo });
  } catch (e) {
    return err(e);
  }
}
