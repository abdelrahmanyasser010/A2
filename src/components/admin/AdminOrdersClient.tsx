"use client";

import { useMemo, useState } from "react";
import { X, MessageSquare, Phone, ShieldAlert, ShieldCheck, Check } from "lucide-react";
import type { OrderRecord, OrderStatus } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import {
  isPhoneBlocked,
  normalizePhone,
  toWhatsAppNumber,
  formatWhatsAppMessage
} from "@/lib/phone";

const statuses: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED"
];

const label = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

export function AdminOrdersClient({
  initialOrders,
  initialBlockedPhones = []
}: {
  initialOrders: OrderRecord[];
  initialBlockedPhones?: string[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [tab, setTab] = useState("ALL");
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState("");
  const [blockedPhones, setBlockedPhones] = useState<string[]>(initialBlockedPhones);
  const [busyPhone, setBusyPhone] = useState(false);

  const visible = useMemo(
    () => (tab === "ALL" ? orders : orders.filter((o) => o.status === tab)),
    [orders, tab]
  );

  async function changeStatus(order: OrderRecord, status: OrderStatus) {
    setMessage("");
    const r = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMessage(d.error || "Unable to update order.");
    setOrders((cur) => cur.map((o) => (o.id === d.order.id ? d.order : o)));
    setSelected(d.order);
    setMessage(`تم تغيير حالة الطلب ${order.orderNumber} إلى ${label(status)}.`);
  }

  async function handleToggleBlock(phone: string, block: boolean) {
    const norm = normalizePhone(phone);
    if (!norm) return;

    if (
      block &&
      !window.confirm(
        `هل تريد بالتأكيد حظر الرقم (${phone})؟ لن يتمكن هذا الرقم من إتمام أي طلبات جديدة من المتجر.`
      )
    ) {
      return;
    }

    setBusyPhone(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: norm, block })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update blacklist");

      setBlockedPhones(data.blockedPhones || []);
      setMessage(
        block
          ? `⛔ تم حظر الرقم (${phone}) بنجاح ومنعه من الطلب.`
          : `✅ تم فك الحظر عن الرقم (${phone}) بنجاح.`
      );
    } catch (err: any) {
      setMessage(err.message || "حدث خطأ أثناء تعديل الحظر.");
    } finally {
      setBusyPhone(false);
    }
  }

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>Fulfilment & Customer Outreach</p>
          <h1>Orders ({orders.length})</h1>
        </div>
        <button className="adminPrimary" onClick={() => window.print()}>
          Export / print
        </button>
      </div>

      {message && <div className="adminAlert">{message}</div>}

      <section className="adminPanel noPad">
        <div className="orderTabs">
          {["ALL", "NEW", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
            (s) => (
              <button
                key={s}
                className={tab === s ? "active" : ""}
                onClick={() => setTab(s)}
              >
                {label(s)}{" "}
                <span>
                  {s === "ALL"
                    ? orders.length
                    : orders.filter((o) => o.status === s).length}
                </span>
              </button>
            )
          )}
        </div>

        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Governorate</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                    No orders found in this tab.
                  </td>
                </tr>
              ) : (
                visible.map((o) => {
                  const blocked = isPhoneBlocked(o.customer.phone, blockedPhones);
                  const waNumber = toWhatsAppNumber(o.customer.phone);
                  const waUrl = waNumber
                    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(formatWhatsAppMessage(o))}`
                    : null;

                  return (
                    <tr key={o.id} className={blocked ? "orderRowBlocked" : ""}>
                      <td>
                        <strong>{o.orderNumber}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span>
                            <strong>
                              {o.customer.firstName} {o.customer.lastName}
                            </strong>
                            {blocked && (
                              <span
                                className="adminBlockedBadge"
                                title="هذا الرقم محظور من إنشاء طلبات جديدة"
                              >
                                ⛔ محظور
                              </span>
                            )}
                          </span>
                          <small style={{ color: "var(--muted)" }}>{o.customer.phone}</small>
                        </div>
                      </td>
                      <td>{o.shipping.governorate}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString("en-EG")}</td>
                      <td>
                        <span style={{ fontSize: "12px" }}>
                          {o.paymentMethod === "COD" ? "Cash (COD)" : o.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <strong>{formatPrice(o.grandTotal)}</strong>
                      </td>
                      <td>
                        <span className={`adminStatus ${o.status.toLowerCase()}`}>
                          {label(o.status)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="orderWaQuickBtn"
                              title="تأكيد الأوردر عبر الواتساب"
                            >
                              <MessageSquare size={13} />
                              واتساب
                            </a>
                          )}
                          <button
                            className="tableAction"
                            onClick={() => setSelected(o)}
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="adminModalBackdrop">
          <section className="adminModal orderModal">
            <div className="adminModalHead">
              <div>
                <p>{selected.orderNumber}</p>
                <h2>
                  {selected.customer.firstName} {selected.customer.lastName}
                </h2>
              </div>
              <button onClick={() => setSelected(null)}>
                <X />
              </button>
            </div>

            {/* Customer Communication & Blacklist Bar */}
            <div className="orderCommBar">
              <div className="orderCommInfo">
                <span>رقم العميل: <strong>{selected.customer.phone}</strong></span>
                {isPhoneBlocked(selected.customer.phone, blockedPhones) && (
                  <span className="adminBlockedBadge">⚠️ هذا الرقم محظور من الطلب</span>
                )}
              </div>
              <div className="orderCommButtons">
                {toWhatsAppNumber(selected.customer.phone) && (
                  <a
                    href={`https://wa.me/${toWhatsAppNumber(selected.customer.phone)}?text=${encodeURIComponent(
                      formatWhatsAppMessage(selected)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adminWaBtn"
                  >
                    <MessageSquare size={15} />
                    مراسلة واتساب (تأكيد الأوردر)
                  </a>
                )}
                <a
                  href={`tel:${normalizePhone(selected.customer.phone)}`}
                  className="adminCallBtn"
                >
                  <Phone size={14} />
                  اتصال هاتفي
                </a>
                {isPhoneBlocked(selected.customer.phone, blockedPhones) ? (
                  <button
                    type="button"
                    disabled={busyPhone}
                    onClick={() => handleToggleBlock(selected.customer.phone, false)}
                    className="adminUnblockBtn"
                  >
                    <ShieldCheck size={14} />
                    فك حظر الرقم
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyPhone}
                    onClick={() => handleToggleBlock(selected.customer.phone, true)}
                    className="adminBlockBtn"
                  >
                    <ShieldAlert size={14} />
                    حظر هذا الرقم ⛔
                  </button>
                )}
              </div>
            </div>

            <div className="orderAdminDetails">
              <div>
                <span>Phone & Email</span>
                <strong>
                  {selected.customer.phone}
                  <br />
                  <small style={{ color: "var(--muted)", fontWeight: "normal" }}>
                    {selected.customer.email || "No email provided"}
                  </small>
                </strong>
              </div>
              <div>
                <span>Address</span>
                <strong>
                  {selected.shipping.governorate} · {selected.shipping.city}
                  <br />
                  {selected.shipping.street}
                </strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>
                  {selected.paymentMethod === "COD" ? "الدفع عند الاستلام (COD)" : selected.paymentMethod}
                  <br />
                  <small style={{ color: "var(--muted)", fontWeight: "normal" }}>
                    الحالة: {selected.paymentStatus}
                  </small>
                </strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatPrice(selected.grandTotal)}</strong>
                <small style={{ color: "var(--muted)", display: "block" }}>
                  شحن: {formatPrice(selected.shippingTotal)} {selected.discountTotal > 0 && `· خصم: ${formatPrice(selected.discountTotal)}`}
                </small>
              </div>
            </div>

            {(selected.shipping.notes || selected.notes) && (
              <div className="orderCustomerNote">
                <strong>ملاحظات العميل للتسليم:</strong>
                <p>{selected.shipping.notes || selected.notes}</p>
              </div>
            )}

            <div className="orderItemsAdmin">
              <strong style={{ padding: "10px 0 5px", fontSize: "13px" }}>المنتجات المطلوبة:</strong>
              {selected.items.map((item) => (
                <div key={item.id}>
                  <span>
                    {item.quantity}× {item.productName}
                    <small>
                      اللون: {item.color} / المقاس: {item.size} · كود SKU: {item.sku}
                    </small>
                  </span>
                  <strong>{formatPrice(item.lineTotal)}</strong>
                </div>
              ))}
            </div>

            <div style={{ margin: "0 20px 20px" }}>
              <label className="statusSelectLabel" style={{ margin: 0 }}>
                تحديث حالة الطلب
                <select
                  value={selected.status}
                  onChange={(e) => changeStatus(selected, e.target.value as OrderStatus)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="statusHistory">
              <strong>سجل تحديثات الطلب (Status history)</strong>
              {[...selected.statusEvents].reverse().map((event, i) => (
                <div key={`${event.createdAt}-${i}`}>
                  <span>{label(event.status)}</span>
                  <small>
                    {new Date(event.createdAt).toLocaleString("en-EG")}{" "}
                    {event.note ? `· ${event.note}` : ""}
                  </small>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
