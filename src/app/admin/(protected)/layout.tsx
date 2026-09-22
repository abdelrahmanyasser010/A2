import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { isAdminAuthenticated } from "@/server/admin-auth";
import { getStoreMeta } from "@/server/store-db";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const meta = await getStoreMeta();
  return <AdminShell demoMode={Boolean(meta.demoData)}>{children}</AdminShell>;
}
