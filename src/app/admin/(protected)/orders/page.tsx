import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";
import { getOrders } from "@/server/store-db";
export const dynamic = "force-dynamic";
export default async function AdminOrdersPage(){return <AdminOrdersClient initialOrders={await getOrders()}/>;}
