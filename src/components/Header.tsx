"use client";

import Link from "next/link";
import { Globe, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useStore } from "./StoreProvider";

export function Header() {
  const [open, setOpen] = useState(false);
  const { cartCount, wishlist, language, toggleLanguage, t } = useStore();

  const navLinks = [
    { label: t("navNewDrop"), href: "/shop?collection=new-drop" },
    { label: t("navShop"), href: "/shop" },
    { label: t("navEssentials"), href: "/shop?collection=essentials" },
    { label: t("navAbout"), href: "/#story" }
  ];

  return (
    <>
      <header className="siteHeader">
        <div className="headerInner">
          <button className="iconButton mobileOnly" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={21} />
          </button>
          <Logo compact />
          <nav className="desktopNav" aria-label="Primary navigation">
            {navLinks.map(({ label, href }) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
          <div className="headerActions">
            <button
              type="button"
              onClick={toggleLanguage}
              className="langSwitchBtn"
              title="Switch language / تغيير اللغة"
              aria-label="Toggle language"
            >
              <Globe size={16} />
              <span>{language === "ar" ? "English" : "عربي"}</span>
            </button>

            <Link className="iconButton" href="/shop" aria-label={t("navSearch")}><Search size={20} /></Link>
            <Link className="iconButton mobileHide" href="/wishlist" aria-label={t("navWishlist")}>
              <Heart size={20} />{wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
            </Link>
            <Link className="iconButton" href="/cart" aria-label={t("navBag")}>
              <ShoppingBag size={20} />{cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      <div className={`mobileMenu ${open ? "isOpen" : ""}`} aria-hidden={!open}>
        <div className="mobileMenuTop">
          <Logo compact />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={toggleLanguage}
              className="langSwitchBtn"
              style={{ padding: "6px 12px", border: "1px solid var(--line)", borderRadius: "999px" }}
            >
              <Globe size={15} />
              <span>{language === "ar" ? "English" : "عربي"}</span>
            </button>
            <button className="iconButton" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
          </div>
        </div>
        <div className="mobileMenuLinks">
          {navLinks.map(({ label, href }, index) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <span>0{index + 1}</span>{label}
            </Link>
          ))}
          <Link href="/wishlist" onClick={() => setOpen(false)}><span>05</span>{t("navWishlist")}</Link>
          <Link href="/account/orders" onClick={() => setOpen(false)}><span>06</span>{t("navOrders")}</Link>
        </div>
        <p className="eyebrow">TWO MINDS. ONE VISION.</p>
      </div>
    </>
  );
}
