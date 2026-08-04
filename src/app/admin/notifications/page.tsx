"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { timeAgo, cn } from "@/lib/utils";
import { useToast } from "@/components/providers";
import { Spinner } from "@/components/ui";
import { IMegaphone, ITrash, IUsers, IUser, IBell } from "@/components/icons";

interface Notif {
  id: number;
  title: string;
  body: string;
  audience: "all" | "users" | "user";
  targetUserId: number | null;
  targetName: string | null;
  createdAt: string;
}

interface UserOpt {
  id: number;
  name: string;
  email: string;
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Notif[] | null>(null);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" as Notif["audience"], targetUserId: "0" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [n, u] = await Promise.all([
      api<{ notifications: Notif[] }>("/api/admin/notifications"),
      api<{ users: UserOpt[] }>("/api/admin/users"),
    ]);
    setList(n.notifications);
    setUsers(u.users);
  }, []);

  useEffect(() => {
    load().catch((e) => toast((e as Error).message, "err"));
  }, [load, toast]);

  const send = async () => {
    setError(null);
    if (form.title.trim().length < 2) return setError("Give the announcement a title.");
    if (form.audience === "user" && form.targetUserId === "0") return setError("Pick the user to target.");
    setBusy(true);
    try {
      await api("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          audience: form.audience,
          targetUserId: parseInt(form.targetUserId, 10) || null,
        }),
      });
      toast("Announcement published 🔔");
      setForm({ title: "", body: "", audience: "all", targetUserId: "0" });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const del = async (n: Notif) => {
    try {
      await api(`/api/admin/notifications?id=${n.id}`, { method: "DELETE" });
      toast("Announcement removed");
      load();
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };

  const audienceMeta = (a: Notif["audience"]) =>
    a === "all"
      ? { label: "All visitors", Icon: IBell, cls: "bg-brand-soft text-brand" }
      : a === "users"
        ? { label: "Logged-in users", Icon: IUsers, cls: "bg-brand-2-soft text-brand-2" }
        : { label: "Specific user", Icon: IUser, cls: "bg-amber-500/12 text-amber-600 dark:text-amber-400" };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="section-kicker">Broadcast</p>
        <h1 className="section-title mt-1">Announcements</h1>

        <div className="card mt-6 p-6">
          <h2 className="flex items-center gap-2 font-display font-bold"><IMegaphone size={18} className="text-brand" /> Compose</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="nt-title">Title</label>
              <input id="nt-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Flash Sale: up to 25% off" />
            </div>
            <div>
              <label className="label" htmlFor="nt-body">Message</label>
              <textarea id="nt-body" className="input min-h-24" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What should the market know?" />
            </div>
            <div>
              <label className="label">Target audience</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["all", "users", "user"] as const).map((a) => {
                  const m = audienceMeta(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setForm({ ...form, audience: a })}
                      className={cn("flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition", form.audience === a ? "border-brand bg-brand-soft" : "border-line text-mute hover:border-mute")}
                      aria-pressed={form.audience === a}
                    >
                      <m.Icon size={14} /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {form.audience === "user" && (
              <div>
                <label className="label" htmlFor="nt-user">Which user?</label>
                <select id="nt-user" className="input" value={form.targetUserId} onChange={(e) => setForm({ ...form, targetUserId: e.target.value })}>
                  <option value="0">— select —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
            )}
            {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500">{error}</p>}
            <button className="btn-brand w-full py-3" onClick={send} disabled={busy}>
              {busy ? <Spinner className="h-5 w-5 text-brand-ink" /> : <IMegaphone size={16} />} Publish announcement
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold">Published ({list?.length ?? "…"})</h2>
        <div className="mt-4 space-y-3">
          {!list && Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          {list?.map((n) => {
            const m = audienceMeta(n.audience);
            return (
              <article key={n.id} className="card animate-fade-up p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase", m.cls)}>
                        <m.Icon size={11} /> {m.label}
                      </span>
                      <span className="text-[11px] font-semibold text-mute">{timeAgo(n.createdAt)}</span>
                    </div>
                    <h3 className="mt-2 font-display font-bold">{n.title}</h3>
                    <p className="mt-1 text-sm text-mute">{n.body}</p>
                    {n.audience === "user" && n.targetName && (
                      <p className="mt-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">→ delivered to {n.targetName}</p>
                    )}
                  </div>
                  <button className="btn-outline h-9 w-9 shrink-0 rounded-full hover:border-red-500 hover:text-red-500" onClick={() => del(n)} aria-label="Delete announcement">
                    <ITrash size={14} />
                  </button>
                </div>
              </article>
            );
          })}
          {list?.length === 0 && <p className="card p-8 text-center text-sm text-mute">Nothing published yet — the bell up top is hungry.</p>}
        </div>
      </div>
    </div>
  );
}
