"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { Spinner } from "@/components/ui";
import { LogoMark, IUser } from "@/components/icons";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const d = await api<{ user: { role: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      window.location.href = next !== "/" ? next : d.user.role === "admin" ? "/admin" : "/";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-[70vh] place-items-center overflow-hidden px-4 py-16">
      <div className="dot-grid absolute inset-0" aria-hidden />
      <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: "var(--brand)" }} aria-hidden />
      <div className="card animate-pop relative w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <h1 className="font-display text-2xl font-extrabold">Welcome back</h1>
            <p className="text-sm text-mute">The market missed you.</p>
          </div>
        </div>
        {error && <p className="mt-5 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500">{error}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="li-email">Email</label>
            <input id="li-email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div>
            <label className="label" htmlFor="li-pass">Password</label>
            <input id="li-pass" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn-brand w-full py-3" disabled={busy}>
            {busy ? <Spinner className="h-5 w-5 text-brand-ink" /> : <IUser size={17} />} Sign in
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-mute">
          New here?{" "}
          <Link href={`/auth/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
