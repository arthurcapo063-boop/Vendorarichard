"use client";

import type { PublicSettings } from "@/lib/settings";
import { waLink } from "@/lib/client";
import { IWhatsApp } from "./icons";

export function WhatsAppWidget({ settings }: { settings: PublicSettings }) {
  if (!settings.whatsappNumber.trim()) return null;
  return (
    <a
      href={waLink(settings.whatsappNumber, `Hello ${settings.siteName}! 👋 I need help with something.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed right-5 bottom-5 z-[60] flex items-center gap-0 rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_14px_38px_-8px_rgba(37,211,102,0.65)] transition-all duration-300 hover:gap-2.5 hover:pr-5"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/50 [animation-duration:2.2s]" />
      <IWhatsApp size={26} />
      <span className="max-w-0 overflow-hidden text-sm font-bold whitespace-nowrap transition-all duration-300 group-hover:max-w-40">
        Chat with us
      </span>
    </a>
  );
}
