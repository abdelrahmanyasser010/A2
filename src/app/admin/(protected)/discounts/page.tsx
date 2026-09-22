import { AdminDiscountsClient } from "@/components/admin/AdminDiscountsClient";
import { getAdminProducts, getDiscounts } from "@/server/store-db";
export const dynamic="force-dynamic";
export default async function AdminDiscountsPage(){const [discounts,products]=await Promise.all([getDiscounts(),getAdminProducts()]);return <AdminDiscountsClient initialDiscounts={discounts} products={products}/>;}
