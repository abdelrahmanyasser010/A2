import { notFound } from "next/navigation";
import { ProductDetailsClient } from "@/components/ProductDetailsClient";
import { ProductGrid } from "@/components/ProductGrid";
import { getStorefrontProduct, getStorefrontProducts } from "@/server/store-db";
export const dynamic = "force-dynamic";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const[product,products]=await Promise.all([getStorefrontProduct(slug),getStorefrontProducts()]);if(!product)notFound();const related=products.filter(item=>item.id!==product.id).slice(0,3);return <div className="pageShell productPage"><ProductDetailsClient product={product}/><section className="relatedSection"><div className="sectionHeading"><div><p className="eyebrow">KEEP LOOKING</p><h2>You may also like</h2></div></div><ProductGrid products={related}/></section></div>}
