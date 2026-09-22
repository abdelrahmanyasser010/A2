import { ShopClient } from "@/components/ShopClient";
import { getStorefrontProducts } from "@/server/store-db";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const products = await getStorefrontProducts();
  const params = await searchParams;
  return (
    <div className="pageShell shopPage">
      <ShopClient products={products} initialCategory={params.category || ""} />
    </div>
  );
}
