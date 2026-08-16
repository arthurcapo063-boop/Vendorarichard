"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useToast } from "@/components/providers";
import { Spinner } from "@/components/ui";
import { ISettings, ICheck } from "@/components/icons";

type SettingsForm = Record<string, string | boolean>;

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "color" | "toggle" | "select";
  hint?: string;
  section: string;
  options?: { value: string; label: string }[];
};

const FIELDS: FieldDef[] = [
  { key: "siteName", label: "Website name", section: "Branding", hint: "Shown in the navbar, footer and browser tab." },
  { key: "tagline", label: "Tagline", section: "Branding" },
  { key: "logoUrl", label: "Logo URL", section: "Branding", hint: "Leave blank to use the built-in mark. Square images work best." },
  { key: "primaryColor", label: "Primary color", type: "color", section: "Branding", hint: "Drives buttons, badges, links and accents site-wide." },
  { key: "secondaryColor", label: "Secondary color", type: "color", section: "Branding", hint: "Used for wallet, success states and secondary accents." },
  { key: "whatsappNumber", label: "WhatsApp number", section: "Contact & WhatsApp", hint: "Digits with country code, e.g. 2348012345678. Powers the floating widget." },
  { key: "contactEmail", label: "Contact email", section: "Contact & WhatsApp" },
  { key: "contactPhone", label: "Contact phone", section: "Contact & WhatsApp" },
  { key: "contactAddress", label: "Contact address", section: "Contact & WhatsApp" },
  { key: "supportHours", label: "Support hours", section: "Contact & WhatsApp" },
  { key: "contactHeading", label: "Contact page heading", section: "Contact & WhatsApp" },
  { key: "contactBody", label: "Contact page body", type: "textarea", section: "Contact & WhatsApp" },
  { key: "instagram", label: "Instagram URL", section: "Social links", hint: "Icon appears only if a URL is set." },
  { key: "facebook", label: "Facebook URL", section: "Social links", hint: "Icon appears only if a URL is set." },
  { key: "twitter", label: "X (Twitter) URL", section: "Social links", hint: "Icon appears only if a URL is set." },
  { key: "tiktok", label: "TikTok URL", section: "Social links", hint: "Icon appears only if a URL is set." },
  { key: "youtube", label: "YouTube URL", section: "Social links", hint: "Icon appears only if a URL is set." },
  { key: "linkedin", label: "LinkedIn URL", section: "Social links", hint: "Icon appears only if a URL is set." },
  { key: "heroHeadline", label: "Hero headline", section: "Homepage copy" },
  { key: "heroSub", label: "Hero subheadline", type: "textarea", section: "Homepage copy" },
  { key: "footerBlurb", label: "Footer blurb", type: "textarea", section: "Homepage copy" },
  { key: "showSoldOut", label: "Show sold-out items in the storefront", type: "toggle", section: "Storefront behaviour", hint: "Off = sold-out products are automatically hidden from listings." },
  { key: "subaccountType", label: "Subaccount type", type: "select", options: [{ value: "personal", label: "Personal" }, { value: "business", label: "Business" }], section: "Paystack split payments (3% / 97%)", hint: "Whether the settlement account is a personal or business account." },
  { key: "subaccountBankName", label: "Subaccount bank name", section: "Paystack split payments (3% / 97%)", hint: "e.g. Access Bank. Resolved to a Paystack bank code when you save." },
  { key: "subaccountAccountNumber", label: "Subaccount account number", section: "Paystack split payments (3% / 97%)", hint: "Verified against the bank on save." },
  { key: "subaccountAccountName", label: "Subaccount account name", section: "Paystack split payments (3% / 97%)", hint: "Must match the name the bank has on file for this account." },
  { key: "chargeProcessingFee", label: "Add processing fee to customer checkout", type: "toggle", section: "Paystack split payments (3% / 97%)", hint: "On = the processing charge below is added to the customer's total at checkout. Off = you absorb it (customers pay the subtotal)." },
  { key: "processingFeePercent", label: "Processing fee percent", type: "text", section: "Paystack split payments (3% / 97%)", hint: "e.g. 3 — shown to customers at checkout." },
];

const SECTIONS = ["Branding", "Contact & WhatsApp", "Social links", "Homepage copy", "Storefront behaviour", "Paystack split payments (3% / 97%)"];

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await api<{ settings: SettingsForm }>("/api/admin/settings");
    setForm({ ...d.settings });
  }, []);

  useEffect(() => {
    load().catch((e) => toast((e as Error).message, "err"));
  }, [load, toast]);

  const set = (k: string, v: string | boolean) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    setBusy(true);
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(form) });
      setSavedAt(new Date().toLocaleTimeString());
      toast("Settings saved — the storefront now reflects your changes ✨");
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(false);
    }
  };

  if (!form) {
    return <div className="space-y-4"><div className="skeleton h-40 rounded-2xl" /><div className="skeleton h-72 rounded-2xl" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Global</p>
          <h1 className="section-title mt-1">App Settings</h1>
          <p className="mt-1 text-sm text-mute">Every field here rewrites the live storefront — no deploys, no code.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="flex items-center gap-1 text-xs font-bold text-brand-2"><ICheck size={13} /> Saved {savedAt}</span>}
          <button className="btn-brand px-6 py-2.5 text-sm" onClick={save} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 text-brand-ink" /> : <ISettings size={14} />} Save changes
          </button>
        </div>
      </div>

      {/* live brand preview */}
      <div className="card mt-6 flex flex-wrap items-center gap-4 p-5">
        <span className="grid h-12 w-12 place-items-center rounded-2xl font-display text-lg font-extrabold" style={{ background: String(form.primaryColor), color: "#fff" }}>
          {String(form.siteName || "V").slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="font-display font-extrabold">{String(form.siteName)}<span style={{ color: String(form.primaryColor) }}>.</span></p>
          <p className="text-xs text-mute">Live preview of your brand identity</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ background: String(form.primaryColor) }}>Primary</span>
          <span className="rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ background: String(form.secondaryColor) }}>Secondary</span>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <section key={section} className="card mt-6 p-6">
          <h2 className="font-display font-bold">{section}</h2>
          {section === "Paystack split payments (3% / 97%)" && (
            <div className="mt-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
              <p className="font-semibold">Payment processing comes with a charge of {Number(form.processingFeePercent) || 3}%</p>
              <p className="mt-0.5 text-xs text-mute">97% of each sale settles to the subaccount; 3% stays in your main account.</p>
            </div>
          )}
          {section === "Paystack split payments (3% / 97%)" && (
            <div className={`mt-3 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 text-sm ${form.subaccountCode ? "border-brand-2 bg-brand-2-soft" : "border-line bg-surface"}`}>
              {form.subaccountCode ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-brand-2" />
                  <span className="font-bold">Subaccount connected</span>
                  <code className="rounded bg-line/40 px-1.5 py-0.5 font-mono text-xs">{String(form.subaccountCode)}</code>
                  <span className="text-xs text-mute">· 3% stays in your main account, 97% settles here automatically.</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-line" />
                  <span className="text-xs text-mute">No subaccount connected yet — fill in the details below and hit <b>Save</b> to route 97% of each payment to this account.</span>
                </>
              )}
            </div>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.filter((f) => f.section === section).map((f) => {
              if (f.type === "select") {
                return (
                  <div key={f.key}>
                    <label className="label" htmlFor={`st-${f.key}`}>{f.label}</label>
                    <select
                      id={`st-${f.key}`}
                      className="input"
                      value={String(form[f.key] ?? f.options?.[0]?.value ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {f.hint && <p className="mt-1 text-[11px] text-mute">{f.hint}</p>}
                  </div>
                );
              }
              if (f.type === "toggle") {
                const on = Boolean(form[f.key]);
                return (
                  <div key={f.key} className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => set(f.key, !on)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-semibold transition ${on ? "border-brand-2 bg-brand-2-soft" : "border-line text-mute"}`}
                      aria-pressed={on}
                    >
                      <span>
                        {f.label}
                        <span className="mt-0.5 block text-xs font-normal text-mute">{f.hint}</span>
                      </span>
                      <span className={`relative ml-4 h-5 w-9 shrink-0 rounded-full ${on ? "bg-brand-2" : "bg-line"}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-4.5" : "left-0.5"}`} />
                      </span>
                    </button>
                  </div>
                );
              }
              if (f.type === "color") {
                const val = String(form[f.key] ?? "#000000");
                return (
                  <div key={f.key}>
                    <label className="label" htmlFor={`st-${f.key}`}>{f.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={val} onChange={(e) => set(f.key, e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-surface p-1" aria-label={`${f.label} picker`} />
                      <input id={`st-${f.key}`} className="input flex-1 font-mono uppercase" value={val} onChange={(e) => set(f.key, e.target.value)} />
                    </div>
                    {f.hint && <p className="mt-1 text-[11px] text-mute">{f.hint}</p>}
                  </div>
                );
              }
              return (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="label" htmlFor={`st-${f.key}`}>{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea id={`st-${f.key}`} className="input min-h-20" value={String(form[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} />
                  ) : (
                    <input id={`st-${f.key}`} className="input" value={String(form[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} />
                  )}
                  {f.hint && <p className="mt-1 text-[11px] text-mute">{f.hint}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="mt-6 flex justify-end">
        <button className="btn-brand px-8 py-3" onClick={save} disabled={busy}>
          {busy ? <Spinner className="h-5 w-5 text-brand-ink" /> : <ISettings size={15} />} Save all settings
        </button>
      </div>
    </div>
  );
}
