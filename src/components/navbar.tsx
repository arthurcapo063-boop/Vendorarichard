"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicSettings } from "@/lib/settings";
import type { SafeUser } from "@/lib/auth";
import { api } from "@/lib/client";
import { timeAgo, cn } from "@/lib/utils";
import { useCart, useTheme } from "./providers";
import { LogoMark, IBell, ICart, IChevR, ILogout, IMoon, ISearch, ISun, IUser, IMenu, IX, IInbox } from "./icons";

interface Notif {
  id: number;
  title: string;
  body: string;
  audience: string;
  targeted: boolean;
  createdAt: string;
}

const READ_KEY = "vd-read-notifs";

export function Navbar({
  settings,
  categories,
}: {
  settings: PublicSettings;
  categories: { id: number; name: string; slug: string }[];
}) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { count, setDrawerOpen } = useCart();

  const [user, setUser] = useState<SafeUser | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  const loadNotifs = useCallback(async () => {
    try {
      const d = await api<{ notifications: Notif[] }>("/api/notifications");
      setNotifs(d.notifications);
    } catch {
      /* bell stays empty */
    }
  }, []);

  useEffect(() => {
    api<{ user: SafeUser | null }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
    loadNotifs();
  }, [loadNotifs]);

  /* badge pulse when cart grows */
  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 500);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  const readIds: number[] = (() => {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as number[];
    } catch {
      return [];
    }
  })();
  const unread = notifs.filter((n) => !readIds.includes(n.id)).length;

  const openBell = () => {
    setBellOpen(true);
    setAcctOpen(false);
    loadNotifs();
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(notifs.map((n) => n.id)));
    } catch {
      /* noop */
    }
  };

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  };

  const signOut = async () => {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const tickerItems = [
    notifs[0]?.title,
    settings.tagline,
    `Chat with us: ${settings.contactPhone}`,
    "Paystack-secured checkout · Wallet payments available",
  ].filter(Boolean) as string[];

  return (
    <header className="sticky top-0 z-50">
      {/* announcement ticker */}
      <div className="overflow-hidden bg-brand text-brand-ink">
        <div className="animate-marquee flex w-max items-center gap-10 py-1.5 text-[11px] font-bold tracking-widest uppercase">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap">
              {t} <span className="opacity-60">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* main bar */}
      <div className="glass border-x-0 border-t-0">
        <div className="container-x flex h-16 items-center gap-2 sm:gap-4">
          <button className="btn-ghost h-10 w-10 lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <IX /> : <IMenu />}
          </button>

          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt={settings.siteName} className="h-9 w-9 rounded-xl object-cover" />
            ) : (
              <LogoMark size={36} className="transition-transform duration-300 group-hover:rotate-6" />
            )}
            <span className="font-display text-xl font-extrabold tracking-tight">
              {settings.siteName}
              <span className="text-brand">.</span>
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 lg:flex">
            <Link href="/shop" className="rounded-full px-3 py-2 text-sm font-semibold text-mute transition hover:bg-raise hover:text-ink">
              Shop all
            </Link>
            {categories.slice(0, 5).map((c) => (
              <Link key={c.id} href={`/shop?cat=${c.slug}`} className="rounded-full px-3 py-2 text-sm font-semibold text-mute transition hover:bg-raise hover:text-ink">
                {c.name}
              </Link>
            ))}
            <Link href="/contact" className="rounded-full px-3 py-2 text-sm font-semibold text-mute transition hover:bg-raise hover:text-ink">
              Contact
            </Link>
          </nav>

          <form onSubmit={submitSearch} className="relative ml-auto hidden w-full max-w-xs md:block lg:max-w-sm">
            <ISearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mute" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search cars, sneakers, cement…"
              className="input rounded-full py-2 pl-10 text-sm"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button className="btn-ghost h-10 w-10" onClick={toggle} aria-label="Toggle theme" title="Toggle dark mode">
              {theme === "dark" ? <ISun /> : <IMoon />}
            </button>

            {/* notifications */}
            <div className="relative">
              <button className="btn-ghost relative h-10 w-10" onClick={openBell} aria-label="Notifications">
                <IBell />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-ink">
                    {unread}
                  </span>
                )}
              </button>
              {bellOpen && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" onClick={() => setBellOpen(false)} aria-label="Close" />
                  <div className="animate-pop absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <p className="font-display text-sm font-bold">Announcements</p>
                      <span className="text-[11px] font-semibold text-mute">{notifs.length} update{notifs.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto slim-scroll">
                      {notifs.length === 0 && (
                        <p className="px-4 py-8 text-center text-sm text-mute">No announcements yet — check back soon.</p>
                      )}
                      {notifs.map((n) => (
                        <article key={n.id} className="border-b border-line/60 px-4 py-3 transition last:border-0 hover:bg-raise">
                          <div className="flex items-start gap-2.5">
                            <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", n.targeted ? "bg-brand-2" : "bg-brand")} />
                            <div>
                              <p className="text-sm font-bold">{n.title}</p>
                              <p className="mt-0.5 text-xs leading-relaxed text-mute">{n.body}</p>
                              <p className="mt-1 text-[10px] font-bold tracking-wider text-mute/70 uppercase">
                                {n.targeted && "For you · "}
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* account */}
            <div className="relative">
              <button
                className={cn("btn-ghost h-10 items-center gap-2 px-2.5", acctOpen && "bg-raise")}
                onClick={() => {
                  setAcctOpen((v) => !v);
                  setBellOpen(false);
                }}
                aria-label="Account"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-brand">
                  <IUser size={15} />
                </span>
                <span className="hidden max-w-24 truncate text-sm font-semibold sm:block">
                  {user ? user.name.split(" ")[0] : "Sign in"}
                </span>
                <IChevR size={13} className="hidden text-mute sm:block" />
              </button>
              {acctOpen && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" onClick={() => setAcctOpen(false)} aria-label="Close" />
                  <div className="animate-pop absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
                    {user ? (
                      <>
                        <div className="border-b border-line px-4 py-3">
                          <p className="truncate text-sm font-bold">{user.name}</p>
                          <p className="truncate text-xs text-mute">{user.email}</p>
                        </div>
                        <MenuItem href="/account" onClick={() => setAcctOpen(false)} icon={<IUser size={15} />}>My dashboard</MenuItem>
                        <MenuItem href="/account?tab=orders" onClick={() => setAcctOpen(false)} icon={<IInbox size={15} />}>Orders</MenuItem>
                        {user.role === "admin" && (
                          <MenuItem href="/admin" onClick={() => setAcctOpen(false)} icon={<ISun size={15} />}>Admin Panel</MenuItem>
                        )}
                        <button onClick={signOut} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-raise">
                          <ILogout size={15} /> Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <MenuItem href="/auth/login" onClick={() => setAcctOpen(false)} icon={<IUser size={15} />}>Sign in</MenuItem>
                        <MenuItem href="/auth/register" onClick={() => setAcctOpen(false)} icon={<IChevR size={15} />}>Create account</MenuItem>
                        <div className="border-t border-line px-4 py-2.5 text-xs text-mute">
                          Track orders, fund your wallet & more.
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* cart */}
            <button
              className={cn("btn-brand relative h-10 px-3.5", bump && "scale-110")}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open cart"
            >
              <ICart size={18} />
              <span className="hidden sm:inline text-sm">Cart</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-surface bg-ink px-1 text-[10px] font-extrabold text-paper">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* mobile panel */}
        {mobileOpen && (
          <div className="animate-fade-up container-x border-t border-line pb-4 lg:hidden">
            <form onSubmit={submitSearch} className="relative mt-3 md:hidden">
              <ISearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mute" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the market…" className="input rounded-full py-2 pl-10" />
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="chip">Shop all</Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/shop?cat=${c.slug}`} onClick={() => setMobileOpen(false)} className="chip">
                  {c.name}
                </Link>
              ))}
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="chip">Contact</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuItem({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition hover:bg-raise">
      <span className="text-mute">{icon}</span> {children}
    </Link>
  );
}
