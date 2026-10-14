"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, X, ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  isAr: boolean;
};

export function AddToCartToast({
  isOpen,
  onClose,
  productName,
  image,
  color,
  size,
  price,
  quantity,
  isAr
}: Props) {
  if (!isOpen) return null;

  return (
    <aside
      className="cartToast"
      role="status"
      aria-live="polite"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="cartToastHeader">
        <div className="cartToastStatus">
          <span className="cartToastIcon">
            <Check size={14} strokeWidth={3} />
          </span>
          <strong>{isAr ? "تمت الإضافة للسلة بنجاح!" : "Added to Cart!"}</strong>
        </div>
        <button
          className="cartToastClose"
          onClick={onClose}
          aria-label={isAr ? "إغلاق الإشعار" : "Close notification"}
        >
          <X size={16} />
        </button>
      </div>

      <div className="cartToastBody">
        <div className="cartToastMedia">
          <Image
            src={image || "/media/A2_full_outfit.webp"}
            alt={productName}
            width={64}
            height={72}
            className="cartToastImg"
          />
        </div>
        <div className="cartToastMeta">
          <h4>{productName}</h4>
          <p className="cartToastSpecs">
            <span>{isAr ? `اللون: ${color}` : `Color: ${color}`}</span>
            <span>•</span>
            <span>{isAr ? `المقاس: ${size}` : `Size: ${size}`}</span>
            {quantity > 1 && (
              <>
                <span>•</span>
                <span>{isAr ? `الكمية: ${quantity}` : `Qty: ${quantity}`}</span>
              </>
            )}
          </p>
          <strong className="cartToastPrice">{formatPrice(price * quantity)}</strong>
        </div>
      </div>

      <div className="cartToastActions">
        <Link href="/checkout" className="cartToastPrimaryBtn" onClick={onClose}>
          <span>{isAr ? "المتابعة لإتمام الشراء" : "Proceed to Checkout"}</span>
          {isAr ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </Link>
        <Link href="/cart" className="cartToastGhostBtn" onClick={onClose}>
          <ShoppingBag size={15} />
          <span>{isAr ? "عرض السلة" : "View Bag"}</span>
        </Link>
      </div>

      <div className="cartToastBar" />
    </aside>
  );
}
