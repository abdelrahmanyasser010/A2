import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";
import { getOrders, getSettings } from "@/server/store-db";
export const dynamic = "force-dynamic";
export default async function AdminOrdersPage() {
  const [orders, settings] = await Promise.all([getOrders(), getSettings()]);
  return <AdminOrdersClient initialOrders={orders} initialBlockedPhones={settings.blockedPhones || []} />;
}
