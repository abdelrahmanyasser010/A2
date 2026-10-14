"use client";

import { useStore } from "@/components/StoreProvider";
import { ProductGrid } from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

export function RelatedProducts({ products }: { products: Product[] }) {
  const { language } = useStore();
  const isAr = language === "ar";

  if (!products.length) return null;

  return (
    <section className="relatedSection">
      <div className="sectionHeading">
        <div>
          <p className="eyebrow">{isAr ? "تشكيلة مختارة" : "KEEP LOOKING"}</p>
          <h2>{isAr ? "قد يعجبك أيضاً" : "You may also like"}</h2>
        </div>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
