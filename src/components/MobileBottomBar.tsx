"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, PackageCheck, ShoppingBag } from "lucide-react";
import { useStore } from "./StoreProvider";

export function MobileBottomBar() {
  const pathname = usePathname();
  const { cartCount, wishlist, t } = useStore();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="storeBottomNav mobileOnly" aria-label="Mobile bottom navigation">
      <Link href="/" className={pathname === "/" ? "active" : ""}>
        <Home size={19} />
        <span>{t("backHomeBtn")}</span>
      </Link>
      <Link href="/shop" className={pathname?.startsWith("/shop") ? "active" : ""}>
        <Compass size={19} />
        <span>{t("navShop")}</span>
      </Link>
      <Link href="/wishlist" className={pathname === "/wishlist" ? "active" : ""}>
        <div className="bottomNavIconWrap">
          <Heart size={19} />
          {wishlist.length > 0 && <span className="bottomNavBadge">{wishlist.length}</span>}
        </div>
        <span>{t("navWishlist")}</span>
      </Link>
      <Link href="/account/orders" className={pathname?.startsWith("/account") ? "active" : ""}>
        <PackageCheck size={19} />
        <span>{t("navOrders")}</span>
      </Link>
      <Link href="/cart" className={pathname === "/cart" ? "active" : ""}>
        <div className="bottomNavIconWrap">
          <ShoppingBag size={19} />
          {cartCount > 0 && <span className="bottomNavBadge">{cartCount}</span>}
        </div>
        <span>{t("navBag")}</span>
      </Link>
    </nav>
  );
}
