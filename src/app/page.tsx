import { getStorefrontProducts } from "@/server/store-db";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getStorefrontProducts();
  return <HomeClient products={products} />;
}
