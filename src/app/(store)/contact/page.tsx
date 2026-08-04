import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/client";
import { ContactClient } from "./contact-client";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <ContactClient
      siteName={s.siteName}
      contactHeading={s.contactHeading}
      contactBody={s.contactBody}
      contactAddress={s.contactAddress}
      contactPhone={s.contactPhone}
      contactEmail={s.contactEmail}
      supportHours={s.supportHours}
      facebook={s.facebook}
      instagram={s.instagram}
      twitter={s.twitter}
      tiktok={s.tiktok}
      youtube={s.youtube}
      linkedin={s.linkedin}
      waHref={waLink(s.whatsappNumber, `Hello ${s.siteName}! I'm reaching out from the contact page.`)}
    />
  );
}
