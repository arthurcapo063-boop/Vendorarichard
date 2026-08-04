import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getCurrentUser,
} from "@/lib/auth";
import { err, json, HttpError } from "@/lib/utils";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;
    if (action === "me") {
      const user = await getCurrentUser();
      return json({ user });
    }
    throw new HttpError(404, "Unknown auth action.");
  } catch (e) {
    return err(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;
    const body = await req.json().catch(() => ({}));

    if (action === "login") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!EMAIL_RE.test(email) || !password) {
        throw new HttpError(400, "Enter a valid email and password.");
      }
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new HttpError(401, "Incorrect email or password.");
      }
      await createSession(user.id);
      const { passwordHash: _ph, ...safe } = user;
      return json({ user: safe });
    }

    if (action === "register") {
      const name = String(body.name ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const whatsapp = String(body.whatsapp ?? "").trim();
      const address = String(body.address ?? "").trim();
      if (name.length < 2) throw new HttpError(400, "Please enter your full name.");
      if (!EMAIL_RE.test(email)) throw new HttpError(400, "Enter a valid email address.");
      if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
      if (whatsapp.replace(/\D/g, "").length < 7) {
        throw new HttpError(400, "Enter a valid WhatsApp number (e.g. 2348012345678).");
      }
      if (address.length < 8) {
        throw new HttpError(400, "Enter your default delivery address.");
      }
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing) throw new HttpError(409, "An account with this email already exists.");
      const [user] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash: hashPassword(password),
          whatsapp,
          address,
        })
        .returning();
      await createSession(user.id);
      const { passwordHash: _ph, ...safe } = user;
      return json({ user: safe }, 201);
    }

    if (action === "logout") {
      await destroySession();
      return json({ ok: true });
    }

    throw new HttpError(404, "Unknown auth action.");
  } catch (e) {
    return err(e);
  }
}
