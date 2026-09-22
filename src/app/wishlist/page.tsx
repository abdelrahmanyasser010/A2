import { WishlistClient } from "@/components/WishlistClient";
import { getStorefrontProducts } from "@/server/store-db";
export const dynamic="force-dynamic";
export default async function WishlistPage(){return <WishlistClient products={await getStorefrontProducts()}/>}
