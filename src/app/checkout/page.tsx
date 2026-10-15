"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { formatPrice } from "@/lib/format";
import type { CheckoutQuote, OrderRecord } from "@/lib/domain";
import { EGYPT_GOVERNORATES } from "@/lib/governorates";
import { getLocalizedProductName, getLocalizedColorName, getLocalizedSize } from "@/lib/types";
import { formatCheckoutError, extractUnavailableSku } from "@/lib/checkout-errors";

export default function CheckoutPage() {
  const { cart, clearCart, removeFromCart, language, t } = useStore();
  const cartPayload = useMemo(() => cart.map((item) => ({ sku: item.sku, quantity: item.quantity })), [cart]);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [governorate, setGovernorate] = useState("Cairo");
  const [coupon, setCoupon] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);

  async function refreshQuote(code = coupon, gov = governorate) {
    if (!cartPayload.length) return setQuote(null);
    setQuoteError("");
    const response = await fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart: cartPayload,
        couponCode: code || undefined,
        governorate: gov || undefined
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setQuote(null);
      return setQuoteError(formatCheckoutError(data.error || "Unable to calculate order.", language));
    }
    setQuote(data.quote);
  }

  useEffect(() => {
    void refreshQuote(coupon, governorate);
  }, [cartPayload]); // eslint-disable-line react-hooks/exhaustive-deps

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCoupon(code);
    await refreshQuote(code, governorate);
  }

  async function onGovernorateChange(nextGov: string) {
    setGovernorate(nextGov);
    await refreshQuote(coupon, nextGov);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) return;
    setBusy(true);
    setSubmitError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      cart: cartPayload,
      couponCode: coupon || undefined,
      customer: {
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        phone: form.get("phone"),
        email: form.get("email")
      },
      shipping: {
        governorate: governorate || form.get("governorate"),
        city: form.get("city"),
        street: form.get("street"),
        notes: form.get("deliveryNotes")
      },
      paymentMethod: "COD"
    };
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setSubmitError(formatCheckoutError(data.error || "Unable to place order.", language));
    setOrder(data.order);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    try {
      localStorage.setItem(
        "a2-last-order",
        JSON.stringify({ orderNumber: data.order.orderNumber, phone: data.order.customer.phone })
      );
    } catch {}
    clearCart();
  }

  useEffect(() => {
    if (order) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [order]);

  if (order)
    return (
      <div className="checkoutSuccess">
        <CheckCircle2 size={54} color="var(--success)" />
        <p className="eyebrow">{t("orderReceivedBadge")} #{order.orderNumber}</p>
        <h1>{t("orderReceivedTitle")}</h1>
        <p>
          {language === "ar"
            ? `شكراً لك! تم استلام وتثبيت طلبك رقم #${order.orderNumber}. سيقوم فريق A² بالتواصل معك قريباً هاتفياً أو عبر الواتساب على رقمك (${order.customer.phone}) لتأكيد المقاس وميعاد التوصيل إلى ${order.shipping.governorate}.`
            : t("orderReceivedDesc", { gov: order.shipping.governorate })}
        </p>
        <div className="successActions">
          <Link className="primaryButton" href="/account/orders">
            {t("trackOrderBtn")}
          </Link>
          <Link className="ghostButton" href="/">
            {t("backHomeBtn")}
          </Link>
        </div>
      </div>
    );

  return (
    <div className="pageShell checkoutPage">
      <header className="pageHero compactHero">
        <p className="eyebrow">{t("checkoutBadge")}</p>
        <h1>{t("checkoutTitle")}</h1>
        <p>{t("checkoutSubtitle")}</p>
      </header>
      {!cart.length ? (
        <div className="emptyState">
          <h2>{t("emptyBagTitle")}</h2>
          <Link className="primaryButton" href="/shop">
            {t("shopTheDropBtn")}
          </Link>
        </div>
      ) : (
        <div className="checkoutLayout">
          <form className="checkoutForm" onSubmit={submit}>
            <fieldset>
              <legend>{t("contactLegend")}</legend>
              <label>
                {t("phoneLabel")}
                <input required name="phone" type="tel" inputMode="tel" placeholder={t("phonePlaceholder")} />
              </label>
              <label>
                {t("emailLabel")}{" "}
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                  ({language === "ar" ? "اختياري" : "Optional"})
                </small>
                <input name="email" type="email" inputMode="email" placeholder={t("emailPlaceholder")} />
              </label>
            </fieldset>

            <fieldset>
              <legend>{t("addressLegend")}</legend>
              <div className="formGrid">
                <label>
                  {t("firstNameLabel")}
                  <input name="firstName" required />
                </label>
                <label>
                  {t("lastNameLabel")}
                  <input name="lastName" required />
                </label>
              </div>
              <label>
                {t("governorateLabel")}
                <select
                  name="governorate"
                  required
                  value={governorate}
                  onChange={(e) => void onGovernorateChange(e.target.value)}
                >
                  <option value="" disabled>
                    {t("selectGovernorate")}
                  </option>
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g.id} value={g.nameEn}>
                      {language === "ar" ? `${g.nameAr} (${g.nameEn})` : `${g.nameEn} — ${g.nameAr}`}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("cityLabel")}
                <input name="city" required placeholder={t("cityPlaceholder")} />
              </label>
              <label>
                {t("streetLabel")}
                <input name="street" required placeholder={t("streetPlaceholder")} />
              </label>
              <label>
                {t("notesLabel")}
                <textarea name="deliveryNotes" rows={3} placeholder={t("notesPlaceholder")} />
              </label>
            </fieldset>

            <fieldset>
              <legend>{t("paymentLegend")}</legend>
              <input type="hidden" name="payment" value="COD" />
              <div className="codPaymentBanner">
                <div className="codPaymentHeader">
                  <span className="codStatusDot" />
                  <strong>
                    {language === "ar"
                      ? "الدفع عند الاستلام فقط (Cash on Delivery)"
                      : "Cash on Delivery (COD)"}
                  </strong>
                </div>
                <p>
                  {language === "ar"
                    ? "الدفع كاش بعد استلام ومعاينة الأوردر. سيقوم فريق خدمة عملاء A² بالتواصل معك هاتفياً أو عبر الواتساب لتأكيد المقاس وتفاصيل الشحن قبل إرسال الطلب."
                    : "Pay in cash upon inspecting your order. Our team will contact you via phone or WhatsApp to confirm sizes and delivery schedule prior to dispatch."}
                </p>
              </div>
            </fieldset>

            {submitError && <div className="checkoutError">{submitError}</div>}
            <button className="primaryButton checkoutSubmit" disabled={busy || !quote}>
              {busy ? (
                <>
                  <Loader2 className="spinIcon" size={18} /> {t("placingOrderBtn")}
                </>
              ) : (
                <>{t("placeOrderBtn")} — {formatPrice(quote?.grandTotal ?? 0)}</>
              )}
            </button>
          </form>

          <aside className="orderSummary checkoutSummary">
            <p className="eyebrow">{t("orderSummaryBadge")}</p>
            {cart.map((item) => (
              <div className="checkoutLine" key={item.key}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                  <span>
                    {item.quantity}× {getLocalizedProductName(item, language)}
                  </span>
                  <small style={{ color: "var(--muted)" }}>
                    {getLocalizedColorName(item.color, language)} / {getLocalizedSize(item.size, language)}
                  </small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.key)}
                    title={language === "ar" ? "حذف من السلة" : "Remove"}
                    aria-label={language === "ar" ? "حذف من السلة" : "Remove item"}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      fontSize: "18px",
                      lineHeight: 1,
                      padding: "2px 4px",
                      opacity: 0.7
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <div className="couponBox">
              <div>
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={t("couponPlaceholder")}
                />
                <button type="button" onClick={applyCoupon}>
                  {t("applyBtn")}
                </button>
              </div>
              {quote?.couponMessage && (
                <small className={quote.couponCode ? "ok" : ""}>
                  {formatCheckoutError(quote.couponMessage, language)}
                </small>
              )}
            </div>
            {quoteError && (
              <div className="checkoutError">
                <p style={{ margin: 0 }}>{quoteError}</p>
                {(() => {
                  const badSku = extractUnavailableSku(quoteError);
                  if (!badSku) return null;
                  return (
                    <button
                      type="button"
                      className="ghostButton"
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        padding: "6px 12px",
                        width: "100%",
                        borderColor: "rgba(239, 68, 68, 0.4)",
                        color: "var(--accent)"
                      }}
                      onClick={() => {
                        const target = cart.find((i) => i.sku === badSku || i.key.includes(badSku));
                        if (target) {
                          removeFromCart(target.key);
                        } else if (cart.length === 1) {
                          removeFromCart(cart[0].key);
                        }
                        setQuoteError("");
                      }}
                    >
                      {language === "ar"
                        ? `إزالة المنتج (${badSku}) من السلة الآن`
                        : `Remove unavailable item (${badSku}) now`}
                    </button>
                  );
                })()}
              </div>
            )}
            <div>
              <span>{t("subtotal")}</span>
              <strong>{formatPrice(quote?.subtotal ?? 0)}</strong>
            </div>
            {Boolean(quote?.discountTotal) && (
              <div>
                <span>{t("discounts")}</span>
                <strong>− {formatPrice(quote?.discountTotal ?? 0)}</strong>
              </div>
            )}
            <div>
              <span>
                {t("shipping")} {governorate ? <small style={{ opacity: 0.7 }}>({governorate})</small> : null}
              </span>
              <strong>{quote?.shippingTotal ? formatPrice(quote.shippingTotal) : t("free")}</strong>
            </div>
            <div className="summaryTotal">
              <span>{t("total")}</span>
              <strong>{formatPrice(quote?.grandTotal ?? 0)}</strong>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
