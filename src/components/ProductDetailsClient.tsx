"use client";

import { useMemo, useState } from "react";
import { Check, Heart, Minus, Plus, Ruler, ShieldCheck, Truck } from "lucide-react";
import {
  Product,
  getLocalizedProductName,
  getLocalizedProductSubtitle,
  getLocalizedProductDescription,
  getLocalizedCategory,
  getLocalizedCollection,
  getLocalizedColorName,
  getLocalizedSize,
  getImagesForColor
} from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useStore } from "./StoreProvider";
import { SpinPreview } from "./SpinPreview";
import { AddToCartToast } from "./AddToCartToast";

export function ProductDetailsClient({ product }: { product: Product }) {
  const firstAvailable = product.variants.find((variant) => variant.stock > 0 && variant.active !== false);
  const [color, setColor] = useState(firstAvailable?.color ?? product.colors[0]?.name ?? "");
  const [size, setSize] = useState(firstAvailable?.size ?? product.sizes[0] ?? "");
  const [activeFrame, setActiveFrame] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted, t, language } = useStore();

  const name = getLocalizedProductName(product, language);
  const subtitle = getLocalizedProductSubtitle(product, language);
  const description = getLocalizedProductDescription(product, language);
  const categoryName = getLocalizedCategory(product.category, language);
  const collectionName = getLocalizedCollection(product.collection, language);

  const activeImages = useMemo(() => getImagesForColor(product, color), [product, color]);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.color === color && variant.size === size),
    [product.variants, color, size]
  );

  const availableSizes = product.sizes.map((candidate) => ({
    size: candidate,
    available: product.variants.some((variant) => variant.color === color && variant.size === candidate && variant.stock > 0 && variant.active !== false)
  }));

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setActiveFrame(0);
    const next = product.variants.find((variant) => variant.color === newColor && variant.stock > 0 && variant.active !== false);
    if (next) setSize(next.size);
  };

  const submit = () => {
    const ok = addToCart(product, { color, size, quantity });
    if (ok) {
      setNotice("");
      setAddedSuccess(true);
      setShowToast(true);
      setTimeout(() => setAddedSuccess(false), 2800);
      setTimeout(() => setShowToast(false), 5500);
    } else {
      setNotice(t("unavailableNotice"));
    }
  };

  return (
    <div className="productPageGrid">
      <div className="productGallery">
        <SpinPreview
          key={color}
          frames={activeImages}
          alt={name}
          priority
          auto={false}
          className="productMainSpin"
          activeFrame={activeFrame}
          onFrameChange={setActiveFrame}
        />
        {activeImages.length > 1 && (
          <div className="galleryStrip">
            {activeImages.map((src, index) => (
              <div
                className={`galleryTile ${index === activeFrame ? "activeTile" : ""}`}
                key={src}
                style={{ backgroundImage: `url(${src})` }}
                onClick={() => setActiveFrame(index)}
                role="button"
                tabIndex={0}
                aria-label={`${name} view ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <section className="productInfo">
        <p className="eyebrow">{collectionName} / {categoryName}</p>
        <h1>{name}</h1>
        {subtitle && <p className="productSubtitle">{subtitle}</p>}
        <div className="productPrice">
          <strong>{formatPrice(product.price)}</strong>
          {product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}
        </div>
        {description && <p className="productDescription">{description}</p>}

        <div className="optionBlock">
          <div className="optionHeading"><span>{t("colorLabel")}</span><strong>{getLocalizedColorName(color, language)}</strong></div>
          <div className="colorOptions">
            {product.colors.map((item) => (
              <button
                key={item.name}
                className={color === item.name ? "selected" : ""}
                onClick={() => handleColorChange(item.name)}
                aria-label={item.name}
              >
                <i style={{ background: item.value }} /><span>{getLocalizedColorName(item.name, language)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="optionBlock">
          <div className="optionHeading"><span>{t("sizeLabel")}</span><button className="textButton"><Ruler size={15} /> {t("sizeGuide")}</button></div>
          <div className="sizeOptions">
            {availableSizes.map((item) => (
              <button key={item.size} disabled={!item.available} className={size === item.size ? "selected" : ""} onClick={() => setSize(item.size)}>
                {getLocalizedSize(item.size, language)}
              </button>
            ))}
          </div>
          {selectedVariant && selectedVariant.stock <= 4 && selectedVariant.stock > 0 && (
            <p className="lowStock">{t("lowStockNotice", { stock: String(selectedVariant.stock) })}</p>
          )}
        </div>

        <div className="buyRow desktopBuyRow">
          <div className="qtyControl">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={16} /></button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock ?? 1, q + 1))}><Plus size={16} /></button>
          </div>
          <button
            className={`primaryButton grow ${addedSuccess ? "addedSuccessBtn" : ""}`}
            onClick={submit}
            disabled={!selectedVariant || selectedVariant.stock < 1}
          >
            {addedSuccess ? (
              <span className="btnAddedContent">
                <Check size={18} className="checkIconAnim" />
                {language === "ar" ? "تمت الإضافة للسلة بنجاح ✓" : "Added to Cart ✓"}
              </span>
            ) : (
              <span>{t("addToBag")} — {formatPrice(product.price * quantity)}</span>
            )}
          </button>
          <button className={`squareButton ${isWishlisted(product.id) ? "active" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label="Add to wishlist"><Heart size={20} /></button>
        </div>
        {notice && <p className="inlineNotice">{notice}</p>}

        <div className="productFacts">
          <div><Truck size={18} /><span><strong>{t("fastDeliveryTitle")}</strong>{t("fastDeliveryDesc")}</span></div>
          <div><ShieldCheck size={18} /><span><strong>{t("easyExchangeTitle")}</strong>{t("easyExchangeDesc")}</span></div>
        </div>

        <div className="productAccordions">
          <details open><summary>{t("materialFit")}</summary><p>{product.material}. {product.fit}.</p></details>
          <details><summary>{t("careInstructions")}</summary><p>{product.care}</p></details>
          <details><summary>{t("shippingReturns")}</summary><p>{t("fastDeliveryDesc")} {t("easyExchangeDesc")}</p></details>
        </div>
      </section>

      <div className="mobileStickyBuy">
        <div><span>{name}</span><strong>{formatPrice(product.price)}</strong></div>
        <button
          className={addedSuccess ? "addedSuccessBtn" : ""}
          onClick={submit}
          disabled={!selectedVariant || selectedVariant.stock < 1}
        >
          {addedSuccess ? (
            <span className="btnAddedContent">
              <Check size={16} className="checkIconAnim" />
              {language === "ar" ? "تمت الإضافة ✓" : "Added ✓"}
            </span>
          ) : (
            t("addToBag")
          )}
        </button>
      </div>

      <AddToCartToast
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        productName={name}
        image={activeImages[0] || product.images[0] || ""}
        color={getLocalizedColorName(color, language)}
        size={getLocalizedSize(size, language)}
        price={product.price}
        quantity={quantity}
        isAr={language === "ar"}
      />
    </div>
  );
}
