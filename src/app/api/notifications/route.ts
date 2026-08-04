import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { err, json } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Visitor-facing feed:
 *  - "all"   → everyone (including guests)
 *  - "users" → logged-in accounts only
 *  - "user"  → a specific targeted account
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const conds = [eq(notifications.audience, "all")];
    if (user) {
      conds.push(eq(notifications.audience, "users"));
      conds.push(and(eq(notifications.audience, "user"), eq(notifications.targetUserId, user.id)) as never);
    }
    const rows = await db
      .select()
      .from(notifications)
      .where(or(...conds))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    return json({
      notifications: rows.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        audience: n.audience,
        targeted: n.audience === "user",
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return err(e);
  }
}
