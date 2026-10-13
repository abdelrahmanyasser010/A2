"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Package,
  Phone,
  MapPin,
  Banknote,
  Truck,
  Box,
  CheckCircle2,
  CheckCheck,
  ShoppingBag,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  RotateCcw,
  Clock,
  ArrowRight
} from "lucide-react";
import type { OrderRecord, OrderStatus } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import { useStore } from "./StoreProvider";

const STEPS: { status: OrderStatus; labelAr: string; labelEn: string; icon: any }[] = [
  { status: "NEW", labelAr: "تم تسجيل الطلب", labelEn: "Order Placed", icon: ShoppingBag },
  { status: "CONFIRMED", labelAr: "تم التأكيد", labelEn: "Confirmed", icon: CheckCircle2 },
  { status: "PREPARING", labelAr: "جاري التجهيز", labelEn: "Preparing", icon: Box },
  { status: "SHIPPED", labelAr: "مع المندوب", labelEn: "Out for Delivery", icon: Truck },
  { status: "DELIVERED", labelAr: "تم التوصيل بنجاح", labelEn: "Delivered", icon: CheckCheck }
];

export function OrderLookupClient() {
  const { t, language } = useStore();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("a2-last-order") || "null");
      if (saved) {
        if (saved.orderNumber) setOrderNumber(saved.orderNumber);
        if (saved.phone) setPhone(saved.phone);
      }
    } catch {}
  }, []);

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setBusy(true);
    setError("");
    const r = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: orderNumber.trim(), phone: phone.trim() })
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setOrder(null);
      return setError(d.error || t("orderNotFound"));
    }
    setOrder(d.order);
  }

  async function requestReturn() {
    if (!reason.trim()) return;
    const r = await fetch("/api/orders/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, phone, reason })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error || "Unable to request return.");
    setOrder(d.order);
    setReason("");
  }

  function handleCopy(text: string) {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusLabel = (status: OrderStatus) => {
    switch (status) {
      case "NEW":
        return language === "ar" ? "أوردر جديد" : "New Order";
      case "CONFIRMED":
        return language === "ar" ? "تم التأكيد" : "Confirmed";
      case "PREPARING":
        return language === "ar" ? "جاري التجهيز" : "Preparing";
      case "SHIPPED":
        return language === "ar" ? "خرج مع المندوب" : "Out for Delivery";
      case "DELIVERED":
        return language === "ar" ? "تم التوصيل بنجاح" : "Delivered";
      case "CANCELLED":
        return language === "ar" ? "تم الإلغاء" : "Cancelled";
      case "RETURN_REQUESTED":
        return language === "ar" ? "طلب استرجاع" : "Return Requested";
      default:
        return status;
    }
  };

  const currentStepIdx = order
    ? STEPS.findIndex((s) => s.status === order.status)
    : -1;

  // Percentage for connector fill
  const progressPercent = currentStepIdx >= 0
    ? (currentStepIdx / (STEPS.length - 1)) * 100
    : 0;

  const orderDateString = order
    ? new Date(order.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  const whatsappMessage = order
    ? encodeURIComponent(
        language === "ar"
          ? `مرحباً A²، أود الاستفسار عن تفاصيل طلبي رقم #${order.orderNumber}`
          : `Hello A², I'd like to ask about my order #${order.orderNumber}`
      )
    : "";

  return (
    <div className="trackPageContainer">
      {/* Header */}
      <header className="trackHeroHeader">
        <div className="trackHeroBadge">
          <Package size={14} />
          <span>A² TRACK & TRACE</span>
        </div>
        <h1 className="trackHeroTitle">
          {language === "ar" ? "تتبع حالة أوردرك" : "Track Your Order"}
        </h1>
        <p className="trackHeroDesc">
          {language === "ar"
            ? "اكتب رقم الطلب ورقم الموبايل المسجل لمعرفة موعد التوصيل ومكان شحنتك لحظة بلحظة."
            : "Enter your order number and registered phone to view live shipment progress."}
        </p>
      </header>

      {/* Search Input Box */}
      <div className="trackSearchCard">
        <form className="trackSearchForm" onSubmit={lookup}>
          <div className="trackFieldGroup">
            <label className="trackFieldLabel">
              {language === "ar" ? "رقم الأوردر" : "Order Number"}
            </label>
            <div className="trackInputWrap">
              <Package className="trackInputIcon" size={17} />
              <input
                className="trackInput"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase().trim())}
                placeholder="A2-1062"
                required
              />
            </div>
          </div>

          <div className="trackFieldGroup">
            <label className="trackFieldLabel">
              {language === "ar" ? "رقم الموبايل المسجل" : "Registered Phone"}
            </label>
            <div className="trackInputWrap">
              <Phone className="trackInputIcon" size={17} />
              <input
                className="trackInput"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.trim())}
                placeholder="01xxxxxxxxx"
                required
              />
            </div>
          </div>

          <button className="trackSubmitBtn" type="submit" disabled={busy}>
            <Search size={16} />
            <span>
              {busy
                ? language === "ar"
                  ? "جاري البحث…"
                  : "Searching…"
                : language === "ar"
                ? "بحث وتتبع الشحنة"
                : "Track Shipment"}
            </span>
          </button>
        </form>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="checkoutError"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderRadius: "12px",
            marginBottom: "24px"
          }}
        >
          <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Order Tracking Receipt */}
      {order && (
        <article className="trackOrderReceipt">
          {/* Receipt Top Header */}
          <div className="receiptHeader">
            <div className="receiptOrderMeta">
              <div className="orderNumberRow">
                <h2 className="orderNumberTitle">#{order.orderNumber}</h2>
                <button
                  type="button"
                  className="copyBtn"
                  onClick={() => handleCopy(order.orderNumber)}
                  title={language === "ar" ? "نسخ رقم الطلب" : "Copy order number"}
                >
                  {copied ? (
                    <>
                      <Check size={13} color="var(--success)" />
                      <span>{language === "ar" ? "تم النسخ" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>{language === "ar" ? "نسخ" : "Copy"}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="receiptDate">
                <Clock size={13} />
                <span>{orderDateString}</span>
              </div>
            </div>

            <div className={`receiptStatusPill ${order.status.toLowerCase()}`}>
              <span className="statusDot" style={{ width: "9px", height: "9px" }} />
              <span>{statusLabel(order.status)}</span>
            </div>
          </div>

          {/* Stepper Timeline (if active milestone) */}
          {currentStepIdx >= 0 && order.status !== "CANCELLED" && (
            <div className="trackStepperWrap">
              <ol className="trackStepsList">
                <div className="trackStepsConnector">
                  <div
                    className="trackStepsConnectorFill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIdx;
                  const isActive = idx === currentStepIdx;
                  const IconComponent = step.icon;
                  return (
                    <li
                      key={step.status}
                      className={`trackStepItem ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
                    >
                      <div className="stepCircle">
                        {isDone ? <Check size={18} strokeWidth={3} /> : <IconComponent size={18} />}
                      </div>
                      <span className="stepLabel">
                        {language === "ar" ? step.labelAr : step.labelEn}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Cancelled Banner */}
          {order.status === "CANCELLED" && (
            <div
              style={{
                padding: "20px 24px",
                background: "rgba(239, 68, 68, 0.08)",
                borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px"
              }}
            >
              <AlertCircle size={20} />
              <div>
                <strong>
                  {language === "ar" ? "تم إلغاء هذا الطلب" : "This order has been cancelled"}
                </strong>
                {order.notes && <p style={{ margin: "4px 0 0", opacity: 0.85 }}>{order.notes}</p>}
              </div>
            </div>
          )}

          {/* Ordered Products Section */}
          <div className="receiptSection">
            <div className="sectionHeaderRow">
              <h3 className="sectionHeaderTitle">
                <ShoppingBag size={16} />
                <span>
                  {language === "ar"
                    ? `محتويات الأوردر (${order.items.reduce((s, i) => s + i.quantity, 0)} قطع)`
                    : `Order Items (${order.items.reduce((s, i) => s + i.quantity, 0)})`}
                </span>
              </h3>
            </div>

            <div className="trackItemsGrid">
              {order.items.map((item) => (
                <div className="trackItemRow" key={item.id}>
                  <div className="trackItemThumb">
                    <Image
                      src={item.image || "/media/demo/full-outfit.webp"}
                      alt={item.productName}
                      fill
                      sizes="60px"
                    />
                  </div>
                  <div className="trackItemInfo">
                    <div className="trackItemName">{item.productName}</div>
                    <div className="trackItemBadges">
                      <span className="trackPill">
                        {language === "ar" ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                      </span>
                      {item.color && <span className="trackPill">{item.color}</span>}
                      {item.size && <span className="trackPill">{item.size}</span>}
                      <span className="trackPill" style={{ opacity: 0.6 }}>
                        {item.sku}
                      </span>
                    </div>
                  </div>
                  <div className="trackItemPrice">
                    {formatPrice(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Billing 2-Column Grid */}
          <div className="receiptDetailsGrid">
            {/* Delivery Details */}
            <div className="receiptDetailCard">
              <div className="receiptDetailCardHeader">
                <MapPin size={16} />
                <span>{language === "ar" ? "عنوان وتفاصيل التوصيل" : "Delivery Details"}</span>
              </div>
              <div className="receiptDetailList">
                <div className="receiptDetailRow">
                  <span>{language === "ar" ? "المستلم" : "Recipient"}</span>
                  <strong>
                    {order.customer.firstName} {order.customer.lastName}
                  </strong>
                </div>
                <div className="receiptDetailRow">
                  <span>{language === "ar" ? "رقم الموبايل" : "Phone"}</span>
                  <strong dir="ltr">{order.customer.phone}</strong>
                </div>
                <div className="receiptDetailRow">
                  <span>{language === "ar" ? "المحافظة والمنطقة" : "Area"}</span>
                  <strong>
                    {order.shipping.governorate} · {order.shipping.city}
                  </strong>
                </div>
                <div className="receiptDetailRow" style={{ alignItems: "flex-start" }}>
                  <span>{language === "ar" ? "العنوان بالتفصيل" : "Street Address"}</span>
                  <strong style={{ textAlign: "end", maxWidth: "60%" }}>
                    {order.shipping.street}
                  </strong>
                </div>
                {order.shipping.notes && (
                  <div className="receiptDetailRow" style={{ alignItems: "flex-start" }}>
                    <span>{language === "ar" ? "ملاحظات التسليم" : "Notes"}</span>
                    <strong style={{ color: "var(--muted)", fontStyle: "italic" }}>
                      {order.shipping.notes}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Billing & Payment Details */}
            <div className="receiptDetailCard">
              <div className="receiptDetailCardHeader">
                <Banknote size={16} />
                <span>{language === "ar" ? "تفاصيل الدفع والفاتورة" : "Payment Summary"}</span>
              </div>
              <div className="receiptDetailList">
                <div className="receiptDetailRow">
                  <span>{language === "ar" ? "طريقة الدفع" : "Payment Method"}</span>
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#22c55e"
                      }}
                    />
                    {order.paymentMethod === "COD"
                      ? language === "ar"
                        ? "الدفع عند الاستلام (كاش)"
                        : "Cash on Delivery (COD)"
                      : language === "ar"
                      ? "بطاقة بنكية"
                      : "Card"}
                  </strong>
                </div>
                <div className="receiptDetailRow">
                  <span>{language === "ar" ? "سعر المنتجات" : "Items Subtotal"}</span>
                  <strong>{formatPrice(order.subtotal)}</strong>
                </div>
                <div className="receiptDetailRow">
                  <span>{language === "ar" ? "مصاريف الشحن" : "Shipping"}</span>
                  <strong>
                    {order.shippingTotal > 0 ? formatPrice(order.shippingTotal) : (
                      <span style={{ color: "#22c55e" }}>
                        {language === "ar" ? "شحن مجاني" : "Free"}
                      </span>
                    )}
                  </strong>
                </div>
                {order.discountTotal > 0 && (
                  <div className="receiptDetailRow">
                    <span>
                      {language === "ar" ? "الخصم" : "Discount"}
                      {order.couponCode ? ` (${order.couponCode})` : ""}
                    </span>
                    <strong style={{ color: "#22c55e" }}>
                      − {formatPrice(order.discountTotal)}
                    </strong>
                  </div>
                )}
                <div className="receiptDetailRow grandTotalRow">
                  <span>{language === "ar" ? "الإجمالي المستحق" : "Grand Total"}</span>
                  <strong>{formatPrice(order.grandTotal)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Support Banner */}
          <div className="trackSupportBanner">
            <div className="trackSupportInfo">
              <div className="trackWaIcon">
                <MessageCircle size={22} />
              </div>
              <div className="trackSupportText">
                <h4>
                  {language === "ar"
                    ? "هل تحتاج لتعديل ميعاد التسليم أو المقاس؟"
                    : "Need help or changes with your order?"}
                </h4>
                <p>
                  {language === "ar"
                    ? "تواصل مباشرة مع خدمة عملاء A² عبر الواتساب برقم أوردرك."
                    : "Chat directly with A² customer support on WhatsApp."}
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/201026601614?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="trackWaBtn"
            >
              <MessageCircle size={16} />
              <span>{language === "ar" ? "مراسلتنا عبر واتساب" : "Chat on WhatsApp"}</span>
            </a>
          </div>

          {/* Return / Exchange request for delivered orders */}
          {order.status === "DELIVERED" && (
            <div className="trackReturnBox">
              <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#f2efe9" }}>
                <RotateCcw size={15} style={{ verticalAlign: "middle", marginInlineEnd: "6px" }} />
                {language === "ar" ? "طلب استبدال أو استرجاع" : "Request Return / Exchange"}
              </h4>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
                rows={2}
              />
              <button
                className="ghostButton"
                style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}
                onClick={requestReturn}
                disabled={!reason.trim()}
              >
                {t("requestReturnBtn")}
              </button>
            </div>
          )}
        </article>
      )}

      {/* Empty State / Continue Shopping */}
      {!order && (
        <div className="emptyState slim" style={{ borderRadius: "16px", marginTop: "16px" }}>
          <h2 style={{ fontSize: "28px" }}>{t("needAnotherPiece")}</h2>
          <p style={{ margin: "8px 0 20px", color: "var(--muted)", fontSize: "14px" }}>
            {language === "ar"
              ? "تصفح أحدث قطع الكولكشن الجديد من A²."
              : "Discover new arrivals from the latest A² drop."}
          </p>
          <Link className="primaryButton" href="/shop">
            <span>{t("continueShopping")}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
