import { ShopClient } from "@/components/ShopClient";
import { getStorefrontProducts } from "@/server/store-db";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const products = await getStorefrontProducts();
  const params = await searchParams;
  return <div className="pageShell shopPage">
    <header className="pageHero compactHero"><p className="eyebrow">A² / COLLECTION</p><h1>Shop</h1><p>Essentials, statement pieces and the newest drop.</p></header>
    <ShopClient products={products} initialCategory={params.category || ""}/>
  </div>;
}
