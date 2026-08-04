import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { err, json, HttpError } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Not signed in." }, 401);
    return json({ user: { ...user, walletBalance: String(user.walletBalance) } });
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const update: Record<string, string> = {};
    if (typeof body.name === "string" && body.name.trim().length >= 2) update.name = body.name.trim();
    if (typeof body.whatsapp === "string") {
      if (body.whatsapp.replace(/\D/g, "").length < 7) throw new HttpError(400, "Enter a valid WhatsApp number.");
      update.whatsapp = body.whatsapp.trim();
    }
    if (typeof body.address === "string") {
      if (body.address.trim().length < 8) throw new HttpError(400, "Enter your full delivery address.");
      update.address = body.address.trim();
    }
    const [updated] = await db.update(users).set(update).where(eq(users.id, user.id)).returning();
    const { passwordHash: _ph, ...safe } = updated;
    return json({ user: { ...safe, walletBalance: String(safe.walletBalance) } });
  } catch (e) {
    return err(e);
  }
}
