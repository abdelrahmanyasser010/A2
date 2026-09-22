"use client";

import Link from "next/link";
import { ProductGrid } from "./ProductGrid";
import { useStore } from "./StoreProvider";
import type { Product } from "@/lib/types";

export function WishlistClient({ products }: { products: Product[] }) {
  const { wishlist, t } = useStore();
  const wished = products.filter((item) => wishlist.includes(item.id));

  return (
    <div className="pageShell shopPage">
      <header className="pageHero compactHero">
        <p className="eyebrow">{t("wishlistEyebrow")}</p>
        <h1>{t("wishlistTitle")}</h1>
        <p>{t("wishlistCount", { count: String(wished.length) })}</p>
      </header>
      {wished.length ? (
        <ProductGrid products={wished} />
      ) : (
        <div className="emptyState">
          <h2>{t("wishlistEmptyTitle")}</h2>
          <p>{t("wishlistEmptyDesc")}</p>
          <Link className="primaryButton" href="/shop">
            {t("exploreTheDrop")}
          </Link>
        </div>
      )}
    </div>
  );
}
