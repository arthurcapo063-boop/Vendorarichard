import { headers } from "next/headers";

/**
 * Resolve the public origin of this deployment — the base URL Paystack uses
 * to bring the customer back after payment (callback_url). Order of preference:
 *   1. NEXT_PUBLIC_SITE_URL (set this to your production domain, e.g. https://shop.com)
 *   2. The request's Origin header
 *   3. The request's Host + x-forwarded-proto
 *   4. The request URL's own origin
 *
 * Always returns an absolute https origin with no trailing slash (except it
 * preserves http:// for localhost so local testing keeps working).
 */
export async function resolveSiteOrigin(): Promise<string> {
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (env) return env;

  const h = await headers();
  const origin = h.get("origin")?.trim().replace(/\/+$/, "");
  if (origin) return origin;

  const proto = h.get("x-forwarded-proto") || (h.get("host")?.startsWith("localhost") ? "http" : "https");
  const host = h.get("host")?.trim();
  if (host) return `${proto}://${host}`;

  return "https://example.com";
}

/** Full callback URL for Paystack. */
export async function resolveCallbackUrl(path: string): Promise<string> {
  return `${await resolveSiteOrigin()}${path}`;
}
