import Link from "next/link";
import { ICheck, IX, IArrowR } from "@/components/icons";
import { SuccessCleaner } from "./cleaner";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; order?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  const failed = sp.status === "failed";
  const isDemo = (sp.ref ?? "").startsWith("demo-");

  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-16">
      <SuccessCleaner />
      <div className="card animate-pop w-full max-w-lg p-10 text-center">
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${failed ? "bg-red-500/12 text-red-500" : "bg-brand-2-soft text-brand-2"}`}
        >
          {failed ? <IX size={38} /> : <ICheck size={38} />}
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold">
          {failed ? "Payment didn't go through" : "Order confirmed!"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mute">
          {failed ? (
            <>The payment for reference <span className="font-mono font-semibold text-ink">{sp.ref ?? "—"}</span> could not be verified. No money left your account — try again or chat with us on WhatsApp.</>
          ) : (
            <>
              Your order <span className="font-mono font-semibold text-ink">{sp.order ?? "—"}</span> is now being processed.
              We'll update its status in your dashboard and ping you on WhatsApp when it ships.
            </>
          )}
        </p>
        {!failed && isDemo && (
          <p className="mt-3 rounded-xl bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Demo mode: no PAYSTACK_SECRET_KEY is configured, so this payment was simulated. Add your key in <span className="font-mono">.env</span> to go live.
          </p>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {!failed && (
            <Link href="/account?tab=orders" className="btn-brand px-6 py-3 text-sm">
              Track order <IArrowR size={15} />
            </Link>
          )}
          <Link href="/shop" className={`${failed ? "btn-brand" : "btn-outline"} px-6 py-3 text-sm`}>
            {failed ? "Try again" : "Continue shopping"}
          </Link>
        </div>
      </div>
    </div>
  );
}
