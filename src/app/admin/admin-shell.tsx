"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers";
import {
  LogoMark,
  IGrid,
  IPackage,
  ITag,
  IInbox,
  IUsers,
  IMegaphone,
  ISettings,
  ISun,
  IMoon,
  ILogout,
  IChevL,
} from "@/components/icons";

interface Me {
  name: string;
  email: string;
  role: string;
}

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: IGrid, exact: true },
  { href: "/admin/products", label: "Products", Icon: IPackage },
  { href: "/admin/categories", label: "Categories", Icon: ITag },
  { href: "/admin/orders", label: "Orders", Icon: IInbox },
  { href: "/admin/users", label: "Users", Icon: IUsers },
  { href: "/admin/notifications", label: "Announcements", Icon: IMegaphone },
  { href: "/admin/promos", label: "Promo Codes", Icon: ITag },
  { href: "/admin/settings", label: "App Settings", Icon: ISettings },
];

export function AdminShell({
  siteName,
  logoUrl,
  children,
}: {
  siteName: string;
  logoUrl: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [me, setMe] = useState<Me | null | "loading">("loading");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    api<{ user: Me | null }>("/api/auth/me")
      .then((d) => {
        if (!d.user || d.user.role !== "admin") {
          window.location.href = "/auth/login?next=/admin";
          return;
        }
        setMe(d.user);
      })
      .catch(() => {
        window.location.href = "/auth/login?next=/admin";
      });
  }, []);

  const signOut = async () => {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (me === "loading" || me === null) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <LogoMark size={48} className="mx-auto animate-pulse" />
          <p className="mt-3 text-sm font-semibold text-mute">Opening the command center…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[250px] transform border-r border-line bg-surface transition-transform duration-300 lg:static lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <LogoMark size={32} />
          )}
          <div className="leading-tight">
            <p className="font-display text-sm font-extrabold">{siteName}</p>
            <p className="text-[10px] font-bold tracking-[0.18em] text-brand uppercase">Command center</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setNavOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  active ? "bg-brand text-brand-ink shadow-lg" : "text-mute hover:bg-raise hover:text-ink"
                )}
              >
                <Icon size={17} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute right-0 bottom-0 left-0 border-t border-line p-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-mute transition hover:bg-raise hover:text-ink">
            <IChevL size={17} /> Back to store
          </Link>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-raise">
            <ILogout size={17} /> Sign out
          </button>
        </div>
      </aside>
      {navOpen && <button className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setNavOpen(false)} aria-label="Close menu" />}

      {/* main */}
      <div className="min-w-0">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-x-0 border-t-0 px-4 sm:px-6">
          <button className="btn-ghost h-10 w-10 lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <IGrid size={18} />
          </button>
          <p className="hidden text-sm font-semibold text-mute sm:block">
            Signed in as <span className="font-bold text-ink">{me.name}</span> · {me.email}
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-2-soft px-3 py-1 text-[11px] font-extrabold tracking-wider text-brand-2 uppercase">Admin</span>
            <button className="btn-ghost h-10 w-10" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <ISun /> : <IMoon />}
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
