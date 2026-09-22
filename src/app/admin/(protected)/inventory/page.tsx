import { AdminInventoryClient } from "@/components/admin/AdminInventoryClient";
import { getInventory } from "@/server/store-db";
export const dynamic="force-dynamic";
export default async function AdminInventoryPage(){const data=await getInventory();return <AdminInventoryClient initialRows={data.rows} initialMovements={data.movements} threshold={data.threshold}/>;}
