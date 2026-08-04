"use client";

import Link from "next/link";
import type { PublicSettings } from "@/lib/settings";
import { waLink } from "@/lib/client";
import {
  LogoMark,
  IFacebook,
  IInstagram,
  ITwitterX,
  ITikTok,
  IYoutube,
  ILinkedin,
  IWhatsApp,
} from "./icons";

export function Footer({
  settings,
  categories,
}: {
  settings: PublicSettings;
  categories: { id: number; name: string; slug: string }[];
}) {
  /* Social icons render ONLY when the admin provided a URL. */
  const socials = [
    { url: settings.instagram, Icon: IInstagram, label: "Instagram" },
    { url: settings.facebook, Icon: IFacebook, label: "Facebook" },
    { url: settings.twitter, Icon: ITwitterX, label: "X (Twitter)" },
    { url: settings.tiktok, Icon: ITikTok, label: "TikTok" },
    { url: settings.youtube, Icon: IYoutube, label: "YouTube" },
    { url: settings.linkedin, Icon: ILinkedin, label: "LinkedIn" },
  ].filter((s) => s.url.trim().length > 0);

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt={settings.siteName} className="h-9 w-9 rounded-xl object-cover" />
            ) : (
              <LogoMark size={36} />
            )}
            <span className="font-display text-xl font-extrabold">
              {settings.siteName}
              <span className="text-brand">.</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">
            {settings.footerBlurb || settings.tagline}
          </p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-line text-mute transition-all duration-200 hover:-translate-y-1 hover:border-brand hover:text-brand"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="section-kicker mb-4">Shop</p>
          <ul className="space-y-2.5 text-sm font-medium text-mute">
            <li><Link className="transition hover:text-brand" href="/shop">All products</Link></li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link className="transition hover:text-brand" href={`/shop?cat=${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="section-kicker mb-4">Help</p>
          <ul className="space-y-2.5 text-sm font-medium text-mute">
            <li><Link className="transition hover:text-brand" href="/contact">Contact us</Link></li>
            <li><Link className="transition hover:text-brand" href="/account?tab=orders">Track an order</Link></li>
            <li><Link className="transition hover:text-brand" href="/account?tab=wallet">Wallet & payments</Link></li>
            <li><Link className="transition hover:text-brand" href="/auth/login">Sign in</Link></li>
          </ul>
        </div>

        <div>
          <p className="section-kicker mb-4">Reach us</p>
          <ul className="space-y-3 text-sm text-mute">
            <li>{settings.contactAddress}</li>
            <li>
              <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className="font-semibold text-ink transition hover:text-brand">
                {settings.contactPhone}
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.contactEmail}`} className="transition hover:text-brand">{settings.contactEmail}</a>
            </li>
            <li className="text-xs">{settings.supportHours}</li>
          </ul>
          <a
            href={waLink(settings.whatsappNumber, `Hello ${settings.siteName}! I have a question.`)}
            target="_blank"
            rel="noreferrer"
            className="btn-brand mt-5 px-4 py-2.5 text-sm"
          >
            <IWhatsApp size={17} /> Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-mute sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.siteName}. Built loud, shipped fast.</p>
          <p className="flex items-center gap-3">
            <span>Secured by Paystack</span>
            <span aria-hidden>·</span>
            <Link href="/admin" className="font-semibold transition hover:text-brand">Admin Panel</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
