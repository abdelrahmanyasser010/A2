import { notFound } from "next/navigation";
import { ProductDetailsClient } from "@/components/ProductDetailsClient";
import { RelatedProducts } from "@/components/RelatedProducts";
import { getStorefrontProduct, getStorefrontProducts } from "@/server/store-db";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, products] = await Promise.all([getStorefrontProduct(slug), getStorefrontProducts()]);
  if (!product) notFound();
  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  return (
    <div className="pageShell productPage">
      <ProductDetailsClient product={product} />
      <RelatedProducts products={related} />
    </div>
  );
}
