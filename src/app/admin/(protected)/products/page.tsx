import { AdminProductsClient } from "@/components/admin/AdminProductsClient";
import { getAdminProducts } from "@/server/store-db";

export const dynamic = "force-dynamic";
export default async function AdminProductsPage() {
  return <AdminProductsClient initialProducts={await getAdminProducts()} />;
}
