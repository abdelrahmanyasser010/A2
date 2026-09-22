"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { cart, cartTotal, updateQuantity, removeFromCart } = useStore();
  const shipping = cartTotal >= 2500 ? 0 : 90;
  return (
    <div className="pageShell cartPage">
      <header className="pageHero compactHero"><p className="eyebrow">YOUR SELECTION</p><h1>Bag</h1><p>{cart.length} line items.</p></header>
      {!cart.length ? <div className="emptyState"><h2>Your bag is empty.</h2><p>The drop is waiting.</p><Link className="primaryButton" href="/shop">Start shopping</Link></div> : (
        <div className="cartLayout">
          <div className="cartItems">
            {cart.map((item) => (
              <article className="cartItem" key={item.key}>
                <Link href={`/product/${item.slug}`} className="cartImage"><Image src={item.image} alt={item.name} fill sizes="120px" /></Link>
                <div className="cartItemBody">
                  <div><Link href={`/product/${item.slug}`}><h3>{item.name}</h3></Link><p>{item.color} / {item.size}</p><small>{item.sku}</small></div>
                  <div className="cartLineBottom">
                    <div className="qtyControl small"><button onClick={() => updateQuantity(item.key, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.key, item.quantity + 1)}><Plus size={14} /></button></div>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                    <button className="textIcon" onClick={() => removeFromCart(item.key)} aria-label="Remove"><Trash2 size={17} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="orderSummary">
            <p className="eyebrow">ORDER SUMMARY</p>
            <div><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div>
            <div><span>Shipping</span><strong>{shipping ? formatPrice(shipping) : "Free"}</strong></div>
            <div className="summaryTotal"><span>Total</span><strong>{formatPrice(cartTotal + shipping)}</strong></div>
            <p className="summaryHint">Free shipping over 2,500 EGP.</p>
            <Link href="/checkout" className="primaryButton">Proceed to checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
