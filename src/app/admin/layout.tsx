import type { ReactNode } from "react";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  return <AdminShell siteName={s.siteName} logoUrl={s.logoUrl}>{children}</AdminShell>;
}
