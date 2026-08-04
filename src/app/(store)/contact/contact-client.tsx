"use client";

import {
  IFacebook,
  IInstagram,
  ITwitterX,
  ITikTok,
  IYoutube,
  ILinkedin,
  IWhatsApp,
} from "@/components/icons";
import { Reveal } from "@/components/ui";

interface ContactProps {
  siteName: string;
  contactHeading: string;
  contactBody: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  supportHours: string;
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  waHref: string;
}

export function ContactClient(s: ContactProps) {
  /* Icons render ONLY when the admin provided a URL. */
  const socials = [
    { url: s.instagram, Icon: IInstagram, label: "Instagram" },
    { url: s.facebook, Icon: IFacebook, label: "Facebook" },
    { url: s.twitter, Icon: ITwitterX, label: "X (Twitter)" },
    { url: s.tiktok, Icon: ITikTok, label: "TikTok" },
    { url: s.youtube, Icon: IYoutube, label: "YouTube" },
    { url: s.linkedin, Icon: ILinkedin, label: "LinkedIn" },
  ].filter((x) => x.url.trim().length > 0);

  const rows = [
    { label: "Visit the store", value: s.contactAddress, href: undefined },
    { label: "Call us", value: s.contactPhone, href: `tel:${s.contactPhone.replace(/\s/g, "")}` },
    { label: "Email", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    { label: "Support hours", value: s.supportHours, href: undefined },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="dot-grid absolute inset-0" aria-hidden />
      <div className="container-x relative grid gap-12 py-16 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <Reveal>
            <p className="section-kicker">Contact us</p>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
              {s.contactHeading}
              <span className="text-brand">.</span>
            </h1>
            <p className="mt-5 max-w-lg leading-relaxed whitespace-pre-line text-mute">{s.contactBody}</p>
          </Reveal>

          {socials.length > 0 && (
            <Reveal delay={150}>
              <p className="label mt-10">Follow the market</p>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-surface text-mute transition-all duration-200 hover:-translate-y-1 hover:border-brand hover:text-brand hover:shadow-lg"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </Reveal>
          )}

          <Reveal delay={220}>
            <a href={s.waHref} target="_blank" rel="noreferrer" className="btn-brand mt-10 px-7 py-3.5">
              <IWhatsApp size={19} /> Message us on WhatsApp
            </a>
          </Reveal>
        </div>

        <div className="space-y-4">
          {rows.map((r, i) => (
            <Reveal key={r.label} delay={i * 90}>
              <div className="card group flex items-center justify-between gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-brand uppercase">{r.label}</p>
                  {r.href ? (
                    <a href={r.href} className="mt-1 block font-display text-lg font-bold transition hover:text-brand">
                      {r.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-display text-lg font-bold">{r.value}</p>
                  )}
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand transition-transform duration-200 group-hover:scale-110">
                  <span className="font-display text-base font-extrabold">{String(i + 1).padStart(2, "0")}</span>
                </span>
              </div>
            </Reveal>
          ))}
          <Reveal delay={380}>
            <div className="rounded-2xl border-2 border-dashed p-5 text-sm font-semibold text-mute" style={{ borderColor: "color-mix(in srgb, var(--brand) 45%, transparent)", background: "var(--brand-soft)" }}>
              Bulk orders on building materials? Mention <span className="font-mono font-bold text-brand">BUILDBULK</span> on WhatsApp for site-delivery pricing.
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
