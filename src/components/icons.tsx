import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: P, children: React.ReactNode, filled = false) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const ICart = (p: P) =>
  base(p, <><circle cx="9" cy="20" r="1.6" /><circle cx="17.5" cy="20" r="1.6" /><path d="M2.5 3.5h2.6l2.4 12h10.6l2.4-8.5H6.2" /></>);
export const IBell = (p: P) =>
  base(p, <><path d="M18 9a6 6 0 1 0-12 0c0 6-2.2 7-2.2 7h16.4S18 15 18 9Z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></>);
export const ISun = (p: P) =>
  base(p, <><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" /></>);
export const IMoon = (p: P) =>
  base(p, <path d="M20.4 14.2A8.5 8.5 0 0 1 9.8 3.6a8.5 8.5 0 1 0 10.6 10.6Z" />);
export const ISearch = (p: P) =>
  base(p, <><circle cx="11" cy="11" r="6.5" /><path d="m20.5 20.5-4.4-4.4" /></>);
export const IUser = (p: P) =>
  base(p, <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20.5c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" /></>);
export const IStar = (p: P) =>
  base(p, <path d="m12 3 2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 16.9 6.4 20l1.2-6.2L3 9.5l6.3-.8L12 3Z" />);
export const IStarFill = (p: P) =>
  base(p, <path d="m12 3 2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 16.9 6.4 20l1.2-6.2L3 9.5l6.3-.8L12 3Z" />, true);
export const IArrowR = (p: P) => base(p, <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>);
export const IChevL = (p: P) => base(p, <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />);
export const IChevR = (p: P) => base(p, <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />);
export const ITrash = (p: P) =>
  base(p, <><path d="M4 7h16M9.5 7V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3V7" /><path d="M6.5 7l.8 12.2a1.8 1.8 0 0 0 1.8 1.6h5.8a1.8 1.8 0 0 0 1.8-1.6L17.5 7" /><path d="M10 11v6M14 11v6" /></>);
export const IPlus = (p: P) => base(p, <path d="M12 5v14M5 12h14" />);
export const IUpload = (p: P) => base(p, <><path d="M12 15V4" /><path d="m7.5 8.5 4.5-4.5 4.5 4.5" /><path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14" /></>);
export const IMinus = (p: P) => base(p, <path d="M5 12h14" />);
export const ICheck = (p: P) => base(p, <path d="m4.5 12.5 5 5 10-11" />);
export const IX = (p: P) => base(p, <path d="M6 6l12 12M18 6 6 18" />);
export const IPackage = (p: P) =>
  base(p, <><path d="m12 2.8 8.5 4.4v9.6L12 21.2l-8.5-4.4V7.2L12 2.8Z" /><path d="m3.8 7.3 8.2 4.3 8.2-4.3M12 11.6v9.4" /></>);
export const IWallet = (p: P) =>
  base(p, <><path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11.5A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" /><path d="M15 12h5v3.5h-5a1.75 1.75 0 1 1 0-3.5Z" /></>);
export const ITag = (p: P) =>
  base(p, <><path d="m3.5 12 8.5 8.5 8.5-8.5-8.5-8.5H5.5A2 2 0 0 0 3.5 5.5v6.5Z" transform="rotate(90 12 12)" /><circle cx="8.7" cy="8.7" r="1.3" /></>);
export const ISettings = (p: P) =>
  base(p, <><circle cx="12" cy="12" r="3.2" /><path d="M19.5 12a7.6 7.6 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2-1.2L14.6 3h-4l-.4 2.6a7.4 7.4 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2Z" /></>);
export const IGrid = (p: P) =>
  base(p, <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>);
export const ILogout = (p: P) =>
  base(p, <><path d="M14 4h-7A1.5 1.5 0 0 0 5.5 5.5v13A1.5 1.5 0 0 0 7 20h7" /><path d="m16 8 4 4-4 4M20 12H9.5" /></>);
export const IMenu = (p: P) => base(p, <path d="M4 7h16M4 12h16M4 17h16" />);
export const ITruck = (p: P) =>
  base(p, <><path d="M2.5 6.5h11v10h-11zM13.5 10h4.2l3.8 3.4v3.1h-8" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>);
export const IShield = (p: P) =>
  base(p, <><path d="M12 2.8 4.5 5.5v6c0 5 3.2 8.2 7.5 9.7 4.3-1.5 7.5-4.7 7.5-9.7v-6L12 2.8Z" /><path d="m8.8 11.8 2.3 2.3 4.2-4.6" /></>);
export const IBolt = (p: P) => base(p, <path d="M13 2.5 4.5 13.5H11l-1 8L18.5 10H12l1-7.5Z" />);
export const IEye = (p: P) =>
  base(p, <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const IPencil = (p: P) =>
  base(p, <><path d="m14.5 5 4.5 4.5L8.5 20H4v-4.5L14.5 5Z" /><path d="m12.5 7 4.5 4.5" /></>);
export const IMegaphone = (p: P) =>
  base(p, <><path d="M3.5 10.5v3A1.5 1.5 0 0 0 5 15h1.5l8.5 4.5v-15L6.5 9H5a1.5 1.5 0 0 0-1.5 1.5Z" /><path d="M18.5 9.5a3.6 3.6 0 0 1 0 5M8 15.5l1 4.5" /></>);
export const IUsers = (p: P) =>
  base(p, <><circle cx="9" cy="8.5" r="3.2" /><path d="M2.8 19.5c1-3 3.4-4.5 6.2-4.5s5.2 1.5 6.2 4.5" /><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.8 15.3c1.7.7 3 2 3.6 4.2" /></>);
export const IInbox = (p: P) =>
  base(p, <><path d="M3.5 13.5 6 5.5h12l2.5 8v4a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17.5v-4Z" /><path d="M3.5 13.5H9l1.2 2.5h3.6l1.2-2.5h5.5" /></>);

/* Brand + social (filled) */
export const IWhatsApp = (p: P) =>
  base(p, <path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.3 4.7 4.8-1.3A9.8 9.8 0 1 0 12 2.2Zm0 1.8a8 8 0 1 1-4.1 14.9l-.3-.2-2.8.8.8-2.7-.2-.3A8 8 0 0 1 12 4Zm-3.1 4c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9 2.2.9 2.6.7 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.2-.7.1l-1 1.2c-.2.2-.3.2-.6.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4 0-.5.1-.7l.5-.6c.2-.2.2-.4.1-.6L9.5 8.5c-.2-.4-.4-.5-.6-.5Z" />, true);
export const IFacebook = (p: P) =>
  base(p, <path d="M13.5 21v-7h2.6l.4-3h-3V9.1c0-.9.3-1.5 1.6-1.5h1.5V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.7v7h2.8Z" />, true);
export const IInstagram = (p: P) =>
  base(p, <><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></>);
export const ITwitterX = (p: P) =>
  base(p, <path d="M17.7 3H21l-7.3 8.3L22.2 21h-6.8l-5-6.1L4.6 21H1.3l7.8-8.9L1.8 3h7l4.5 5.6L17.7 3Zm-1.2 16h1.9L6.9 4.9H4.9L16.5 19Z" />, true);
export const ITikTok = (p: P) =>
  base(p, <path d="M16.6 3c.4 2.3 1.8 3.7 4.4 3.9v3c-1.7 0-3.2-.5-4.4-1.4v6.6c0 3.9-2.6 6.2-6.1 6.2A5.9 5.9 0 0 1 4.4 15c0-3.6 2.8-6 6.4-5.8v3.1c-.4-.1-.8-.2-1.2-.2-1.4 0-2.4 1-2.4 2.6 0 1.5 1.1 2.6 2.6 2.6 1.7 0 2.8-1.2 2.8-3.4V3h4Z" />, true);
export const IYoutube = (p: P) =>
  base(p, <><path d="M21.5 12s0-3.3-.4-4.8a2.5 2.5 0 0 0-1.8-1.8C17.7 5 12 5 12 5s-5.7 0-7.3.4A2.5 2.5 0 0 0 2.9 7.2C2.5 8.7 2.5 12 2.5 12s0 3.3.4 4.8a2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.3.4 7.3.4s5.7 0 7.3-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.5.4-4.8.4-4.8Z" /><path d="m10 9.3 5 2.7-5 2.7V9.3Z" fill="var(--surface)" stroke="none" /></>);
export const ILinkedin = (p: P) =>
  base(p, <path d="M6.5 8.8H3.6V21h2.9V8.8ZM5 7.4a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM21 13.9c0-3-1.6-4.9-4.2-4.9a3.6 3.6 0 0 0-3.3 1.8V8.8h-2.9V21h2.9v-6.4c0-1.6.8-2.6 2.2-2.6 1.3 0 2 .9 2 2.6V21H21v-7.1Z" />, true);

/* Default logo mark (used when Admin hasn't set a logo URL) */
export function LogoMark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="lg-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--brand-2)" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="13" fill="url(#lg-mark)" />
      <path
        d="M14 15.5 24 33l10-17.5h-5.2L24 24.6l-4.8-9.1H14Z"
        fill="var(--brand-ink)"
      />
      <circle cx="35" cy="14" r="3.2" fill="var(--brand-ink)" opacity="0.9" />
    </svg>
  );
}
