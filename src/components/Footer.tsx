"use client";

import Link from "next/link";
import { useStore } from "./StoreProvider";

export function Footer() {
  const { language } = useStore();
  const isAr = language === "ar";

  return (
    <footer className="footer" id="story">
      <div className="footerLead">
        <p className="eyebrow">A² / MEN&apos;S WEAR</p>
        <h2>
          {isAr ? (
            <>أكثر من مجرد ملابس.<br />رؤية وأسلوب حياة.</>
          ) : (
            <>More than clothes.<br />A point of view.</>
          )}
        </h2>
      </div>
      <div className="footerGrid">
        <div>
          <strong>{isAr ? "المتجر" : "Shop"}</strong>
          <Link href="/shop">{isAr ? "جميع المنتجات" : "All products"}</Link>
          <Link href="/shop?collection=new-drop">{isAr ? "وصل حديثاً" : "New drop"}</Link>
          <Link href="/wishlist">{isAr ? "قائمة المفضلة" : "Wishlist"}</Link>
        </div>
        <div>
          <strong>{isAr ? "المساعدة" : "Help"}</strong>
          <a href="#">{isAr ? "الشحن والاستبدال" : "Shipping & returns"}</a>
          <a href="#">{isAr ? "دليل المقاسات" : "Size guide"}</a>
          <Link href="/account/orders">{isAr ? "تتبع حالة طلبك" : "Track order"}</Link>
        </div>
        <div>
          <strong>{isAr ? "تابعنا" : "Follow"}</strong>
          <a href="#">Instagram</a>
          <a href="#">TikTok</a>
          <a href="#">Facebook</a>
        </div>
      </div>
      <div className="footerBottom">
        <span>© 2026 A²</span>
        <span>TWO MINDS. ONE VISION.</span>
      </div>
    </footer>
  );
}
