import { db } from "@/db";
import { settings, type Setting } from "@/db/schema";

let cache: { at: number; value: Setting } | null = null;
const TTL = 20_000;

export async function getSettings(): Promise<Setting> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  const rows = await db.select().from(settings).limit(1);
  const value = rows[0];
  if (!value) throw new Error("Settings row missing — run the seed script.");
  cache = { at: Date.now(), value };
  return value;
}

export function bustSettingsCache(): void {
  cache = null;
}

/** Public subset exposed to browser bundles. */
export function publicSettings(s: Setting) {
  return {
    siteName: s.siteName,
    tagline: s.tagline,
    logoUrl: s.logoUrl,
    primaryColor: s.primaryColor,
    secondaryColor: s.secondaryColor,
    currency: s.currency,
    whatsappNumber: s.whatsappNumber,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    contactAddress: s.contactAddress,
    contactHeading: s.contactHeading,
    contactBody: s.contactBody,
    supportHours: s.supportHours,
    heroHeadline: s.heroHeadline,
    heroSub: s.heroSub,
    footerBlurb: s.footerBlurb,
    facebook: s.facebook,
    instagram: s.instagram,
    twitter: s.twitter,
    tiktok: s.tiktok,
    youtube: s.youtube,
    linkedin: s.linkedin,
    showSoldOut: s.showSoldOut,
    flashSaleEndsAt: s.flashSaleEndsAt?.toISOString() ?? null,
  };
}

export type PublicSettings = ReturnType<typeof publicSettings>;
