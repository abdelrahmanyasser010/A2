"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { SpinPreview } from "./SpinPreview";
import { useStore } from "./StoreProvider";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { toggleWishlist, isWishlisted } = useStore();
  const wished = isWishlisted(product.id);

  return (
    <article className="productCard">
      <div className="productMedia">
        <Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
          <SpinPreview frames={product.spinFrames} alt={product.name} priority={priority} />
        </Link>
        <button className={`wishButton ${wished ? "active" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist">
          <Heart size={18} fill={wished ? "currentColor" : "none"} />
        </button>
        <div className="productFlags">
          {product.isNew && <span>NEW</span>}
          {product.compareAtPrice && <span>SALE</span>}
        </div>
      </div>
      <div className="productMeta">
        <Link href={`/product/${product.slug}`}>
          <h3>{product.name}</h3>
          <p>{product.subtitle}</p>
        </Link>
        <div className="priceLine">
          <strong>{formatPrice(product.price)}</strong>
          {product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}
        </div>
        <div className="swatches" aria-label="Available colors">
          {product.colors.map((color) => <i key={color.name} title={color.name} style={{ background: color.value }} />)}
        </div>
      </div>
    </article>
  );
}
