import { computeQuote, type CartLineInput } from "@/lib/pricing";
import { err, json } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const items = (Array.isArray(body.items) ? body.items : []) as CartLineInput[];
    const quote = await computeQuote(items, body.promoCode ?? null);
    return json({ quote });
  } catch (e) {
    return err(e);
  }
}
