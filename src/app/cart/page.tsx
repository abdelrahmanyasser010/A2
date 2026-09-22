"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { cart, cartTotal, updateQuantity, removeFromCart, t } = useStore();
  const shipping = cartTotal >= 2500 ? 0 : 90;

  return (
    <div className="pageShell cartPage">
      <header className="pageHero compactHero">
        <p className="eyebrow">{t("cartBadge")}</p>
        <h1>{t("cartTitle")}</h1>
        <p>{t("cartItemCount", { count: String(cart.length) })}</p>
      </header>
      {!cart.length ? (
        <div className="emptyState">
          <h2>{t("emptyBagTitle")}</h2>
          <p>{t("cartEmptyDesc")}</p>
          <Link className="primaryButton" href="/shop">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="cartLayout">
          <div className="cartItems">
            {cart.map((item) => (
              <article className="cartItem" key={item.key}>
                <Link href={`/product/${item.slug}`} className="cartImage">
                  <Image src={item.image} alt={item.name} fill sizes="120px" />
                </Link>
                <div className="cartItemBody">
                  <div>
                    <Link href={`/product/${item.slug}`}>
                      <h3>{item.name}</h3>
                    </Link>
                    <p>
                      {item.color} / {item.size}
                    </p>
                    <small>{item.sku}</small>
                  </div>
                  <div className="cartLineBottom">
                    <div className="qtyControl small">
                      <button onClick={() => updateQuantity(item.key, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.key, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                    <button
                      className="textIcon"
                      onClick={() => removeFromCart(item.key)}
                      aria-label="Remove"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="orderSummary">
            <p className="eyebrow">{t("orderSummaryBadge")}</p>
            <div>
              <span>{t("subtotal")}</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>
            <div>
              <span>{t("shipping")}</span>
              <strong>{shipping ? formatPrice(shipping) : t("free")}</strong>
            </div>
            <div className="summaryTotal">
              <span>{t("total")}</span>
              <strong>{formatPrice(cartTotal + shipping)}</strong>
            </div>
            <p className="summaryHint">{t("freeShippingHint")}</p>
            <Link href="/checkout" className="primaryButton">
              {t("proceedToCheckout")}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
