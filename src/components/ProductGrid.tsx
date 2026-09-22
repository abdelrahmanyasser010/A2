import { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="productGrid">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 2} />
      ))}
    </div>
  );
}
