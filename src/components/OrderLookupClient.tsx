"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { OrderRecord, OrderStatus } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import { useStore } from "./StoreProvider";

const flow: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"];

export function OrderLookupClient() {
  const { t, language } = useStore();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("a2-last-order") || "null");
      if (saved) {
        setOrderNumber(saved.orderNumber || "");
        setPhone(saved.phone || "");
      }
    } catch {}
  }, []);

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, phone })
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

  const statusLabel = (status: OrderStatus) => {
    switch (status) {
      case "NEW":
        return t("statusNew");
      case "CONFIRMED":
        return t("statusConfirmed");
      case "PREPARING":
        return t("statusPreparing");
      case "SHIPPED":
        return t("statusShipped");
      case "DELIVERED":
        return t("statusDelivered");
      case "CANCELLED":
        return t("statusCancelled");
      default:
        return status;
    }
  };

  const idx = order ? flow.indexOf(order.status) : -1;

  const timelineLabels = language === "ar"
    ? "أوردر جديد ← تم التأكيد ← جاري التجهيز ← مع المندوب ← تم التوصيل"
    : "New → Confirmed → Preparing → Shipped → Delivered";

  return (
    <div className="orderLookupArea">
      <form className="orderLookupForm" onSubmit={lookup}>
        <label>
          {t("orderNumberLabel")}
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder={t("orderNumberPlaceholder")}
            required
          />
        </label>
        <label>
          {t("trackPhoneLabel")}
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            required
          />
        </label>
        <button className="primaryButton" disabled={busy}>
          {busy ? t("trackingBtn") : t("trackBtn")}
        </button>
      </form>

      {error && <div className="checkoutError">{error}</div>}

      {order && (
        <div className="orderTrackCard detailed">
          <div>
            <span className="statusDot" />
            <div>
              <strong>{order.orderNumber}</strong>
              <p>
                {order.items.reduce((s, i) => s + i.quantity, 0)} {language === "ar" ? "منتجات" : "items"} · {formatPrice(order.grandTotal)}
              </p>
            </div>
          </div>
          <span className={`statusPill ${order.status.toLowerCase()}`}>
            {statusLabel(order.status)}
          </span>

          {idx >= 0 && (
            <>
              <div className="orderTimeline">
                {flow.slice(1).map((_, i) => (
                  <i key={i} className={i < idx ? "done" : i === idx ? "active" : ""} />
                ))}
              </div>
              <small>{timelineLabels}</small>
            </>
          )}

          <div className="orderLookupItems">
            {order.items.map((i) => (
              <div key={i.id}>
                <span>
                  {i.quantity}× {i.productName}
                  <small>
                    {i.color} / {i.size}
                  </small>
                </span>
                <strong>{formatPrice(i.lineTotal)}</strong>
              </div>
            ))}
          </div>

          <div className="orderAddress">
            <span>{t("deliveryTo")}</span>
            <strong>
              {order.shipping.governorate} · {order.shipping.city}
              <br />
              {order.shipping.street}
            </strong>
          </div>

          {order.status === "DELIVERED" && (
            <div className="returnRequest">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
                rows={2}
              />
              <button className="ghostButton" onClick={requestReturn}>
                {t("requestReturnBtn")}
              </button>
            </div>
          )}
        </div>
      )}

      {!order && (
        <div className="emptyState slim">
          <h2>{t("needAnotherPiece")}</h2>
          <Link className="ghostButton" href="/shop">
            {t("continueShopping")}
          </Link>
        </div>
      )}
    </div>
  );
}
