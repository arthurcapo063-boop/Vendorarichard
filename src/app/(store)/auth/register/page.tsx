"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { Spinner } from "@/components/ui";
import { LogoMark } from "@/components/icons";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/";
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", address: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          whatsapp: form.whatsapp,
          address: form.address,
          password: form.password,
        }),
      });
      window.location.href = next;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`rg-${k}`}>{label}</label>
      <input id={`rg-${k}`} className="input" value={form[k]} onChange={set(k)} {...props} />
    </div>
  );

  return (
    <div className="relative grid min-h-[70vh] place-items-center overflow-hidden px-4 py-16">
      <div className="dot-grid absolute inset-0" aria-hidden />
      <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: "var(--brand-2)" }} aria-hidden />
      <div className="card animate-pop relative w-full max-w-lg p-8">
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <h1 className="font-display text-2xl font-extrabold">Join the market</h1>
            <p className="text-sm text-mute">Wallet, order tracking & member-only drops.</p>
          </div>
        </div>
        {error && <p className="mt-5 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500">{error}</p>}
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {field("name", "Full name", { required: true, placeholder: "Adaeze Okafor" })}
          {field("email", "Email", { required: true, type: "email", placeholder: "you@email.com" })}
          {field("whatsapp", "WhatsApp number", { required: true, placeholder: "2348012345678" })}
          {field("password", "Password", { required: true, type: "password", placeholder: "Min. 6 characters", minLength: 6 })}
          <div className="sm:col-span-2">{field("address", "Default delivery address", { required: true, placeholder: "Street, city, state" })}</div>
          {field("confirm", "Confirm password", { required: true, type: "password", placeholder: "Repeat password" })}
          <button className="btn-brand mt-2 w-full py-3 sm:col-span-2" disabled={busy}>
            {busy && <Spinner className="h-5 w-5 text-brand-ink" />} Create my account
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-mute">
          Already a member?{" "}
          <Link href={`/auth/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
