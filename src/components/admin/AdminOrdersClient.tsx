"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  MessageSquare,
  Phone,
  Eye,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  CheckSquare,
  Square,
  Layers,
  ArrowRight
} from "lucide-react";
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

const statusArabicMap: Record<string, string> = {
  NEW: "طلب جديد",
  CONFIRMED: "تم التأكيد",
  PREPARING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
  RETURN_REQUESTED: "طلب إرجاع",
  RETURNED: "مرتجع",
  REFUNDED: "مسترجع"
};

const tabArabicMap: Record<string, string> = {
  ALL: "الكل",
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PREPARING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي"
};

const label = (value: string) => statusArabicMap[value] || value;

export function AdminOrdersClient({
  initialOrders,
  initialBlockedPhones = []
}: {
  initialOrders: OrderRecord[];
  initialBlockedPhones?: string[];
}) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [tab, setTab] = useState("ALL");
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState("");
  const [blockedPhones, setBlockedPhones] = useState<string[]>(initialBlockedPhones);
  const [busyPhone, setBusyPhone] = useState(false);

  // Multi-select for bulk status updates
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("CONFIRMED");
  const [bulkBusy, setBulkBusy] = useState(false);

  // Contacted orders tracking
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem("a2-contacted-orders");
      if (saved) {
        setContactedIds(new Set(JSON.parse(saved)));
      }
    } catch {}
  }, []);

  function markAsContacted(orderId: string) {
    setContactedIds((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      try {
        localStorage.setItem("a2-contacted-orders", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }

  const visible = useMemo(
    () => (tab === "ALL" ? orders : orders.filter((o) => o.status === tab)),
    [orders, tab]
  );

  const allVisibleSelected = useMemo(
    () => visible.length > 0 && visible.every((o) => selectedIds.has(o.id)),
    [visible, selectedIds]
  );

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((o) => o.id)));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function changeStatus(order: OrderRecord, status: OrderStatus) {
    setMessage("");
    const r = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMessage(d.error || "تعذر تحديث حالة الطلب.");
    setOrders((cur) => cur.map((o) => (o.id === d.order.id ? d.order : o)));
    if (selected?.id === d.order.id) {
      setSelected(d.order);
    }
    setMessage(`✅ تم تغيير حالة الطلب ${order.orderNumber} مباشرة إلى (${label(status)}).`);
  }

  async function handleBulkStatusChange() {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    setMessage("");

    const idsArray = Array.from(selectedIds);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsArray, status: bulkStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر التحديث المجمّع.");

      // Update state with modified orders
      if (Array.isArray(data.orders)) {
        const updatedMap = new Map(data.orders.map((o: OrderRecord) => [o.id, o]));
        setOrders((cur) => cur.map((o) => (updatedMap.has(o.id) ? (updatedMap.get(o.id) as OrderRecord) : o)));
      }
      setMessage(`🎉 تم تحديث حالة ${data.count} طلب بنجاح إلى (${label(bulkStatus)}).`);
      setSelectedIds(new Set());
    } catch (err: any) {
      setMessage(err.message || "حدث خطأ أثناء التحديث المجمّع.");
    } finally {
      setBulkBusy(false);
    }
  }

  function handleWhatsAppClick(order: OrderRecord, waUrl: string) {
    markAsContacted(order.id);
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // If order is newly placed, automatically advance it to confirmed!
    if (order.status === "NEW") {
      void changeStatus(order, "CONFIRMED");
      setMessage(`💬 تم فتح الواتساب وتغيير حالة الطلب ${order.orderNumber} إلى (تم التأكيد) تلقائياً.`);
    } else {
      setMessage(`💬 تم فتح محادثة الواتساب مع العميل وتحديد الطلب كـ (تم التواصل).`);
    }
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
      if (!res.ok) throw new Error(data.error || "تعذر تعديل الحظر");

      setBlockedPhones(data.blockedPhones || []);
      setMessage(
        block
          ? `⛔ تم حظر الرقم (${phone}) بنجاح ومنعه من تقديم طلبات جديدة.`
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
          <p>إدارة وتنفيذ الطلبات والتواصل السريع مع العملاء</p>
          <h1>الطلبات ({orders.length})</h1>
        </div>
        <button className="adminPrimary" onClick={() => window.print()}>
          طباعة / تصدير الكشف
        </button>
      </div>

      {message && <div className="adminAlert">{message}</div>}

      {/* Bulk Action Sticky Bar */}
      {selectedIds.size > 0 && (
        <div className="adminBulkActionBar">
          <div className="bulkActionInfo">
            <Layers size={18} />
            <span>
              تم تحديد <strong>{selectedIds.size}</strong> طلب
            </span>
          </div>
          <div className="bulkActionControls">
            <span className="bulkLabel">تغيير حالة المحددين إلى:</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
              className="bulkSelect"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={handleBulkStatusChange}
              className="bulkApplyBtn"
            >
              {bulkBusy ? "جاري التحديث…" : "تطبيق الآن"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="bulkCancelBtn"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      <section className="adminPanel noPad">
        <div className="orderTabs">
          {["ALL", "NEW", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
            (s) => (
              <button
                key={s}
                className={tab === s ? "active" : ""}
                onClick={() => setTab(s)}
              >
                {tabArabicMap[s] || s}{" "}
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
                <th style={{ width: "42px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    title="تحديد كل الطلبات المعروضة"
                    style={{ width: "17px", height: "17px", cursor: "pointer" }}
                  />
                </th>
                <th>رقم الطلب</th>
                <th>بيانات العميل</th>
                <th>المحافظة</th>
                <th>تاريخ الطلب</th>
                <th>الدفع</th>
                <th>الإجمالي</th>
                <th>الحالة (تغيير فوري)</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "35px", color: "var(--muted)", fontSize: "15px" }}>
                    لا توجد طلبات في هذا القسم حالياً.
                  </td>
                </tr>
              ) : (
                visible.map((o) => {
                  const blocked = isPhoneBlocked(o.customer.phone, blockedPhones);
                  const waNumber = toWhatsAppNumber(o.customer.phone);
                  const isContacted = contactedIds.has(o.id);
                  const isSelected = selectedIds.has(o.id);
                  const waUrl = waNumber
                    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(formatWhatsAppMessage(o))}`
                    : null;

                  return (
                    <tr
                      key={o.id}
                      className={`${blocked ? "orderRowBlocked" : ""} ${isSelected ? "orderRowSelected" : ""}`}
                    >
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(o.id)}
                          style={{ width: "17px", height: "17px", cursor: "pointer" }}
                        />
                      </td>
                      <td>
                        <strong style={{ fontSize: "15px" }}>{o.orderNumber}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span style={{ fontSize: "14.5px", fontWeight: "700" }}>
                            {o.customer.firstName} {o.customer.lastName}
                            {blocked && (
                              <span
                                className="adminBlockedBadge"
                                title="هذا الرقم محظور من إنشاء طلبات جديدة"
                              >
                                ⛔ محظور
                              </span>
                            )}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <small style={{ color: "#30322b", fontWeight: "600", direction: "ltr", textAlign: "right", fontSize: "13px" }}>
                              {o.customer.phone}
                            </small>
                            {isContacted && (
                              <span className="adminContactedBadge" title="تم فتح الواتساب للتواصل مع العميل">
                                ✓ تم التواصل
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: "600" }}>{o.shipping.governorate}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString("ar-EG")}</td>
                      <td>
                        <span style={{ fontSize: "12.5px", fontWeight: "600" }}>
                          {o.paymentMethod === "COD" ? "كاش استلام" : o.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: "15px", color: "#161714" }}>
                          {formatPrice(o.grandTotal)}
                        </strong>
                      </td>
                      <td>
                        {/* Direct Inline Status Changer */}
                        <div className="inlineStatusWrap">
                          <select
                            className={`adminInlineStatusSelect ${o.status.toLowerCase()}`}
                            value={o.status}
                            onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                            title="تغيير حالة الطلب مباشرة دون فتح النافذة"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {label(s)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="orderRowActions">
                          {waUrl && (
                            <button
                              type="button"
                              onClick={() => handleWhatsAppClick(o, waUrl)}
                              className={`orderActionIconBtn wa ${isContacted ? "contacted" : ""}`}
                              title={
                                isContacted
                                  ? "تم التواصل مع العميل (اضغط للمراسلة مجدداً)"
                                  : "مراسلة وتأكيد الأوردر عبر الواتساب"
                              }
                              aria-label="واتساب"
                            >
                              <MessageSquare size={17} />
                              {isContacted && <span className="actionIconBadge">✓</span>}
                            </button>
                          )}
                          <button
                            type="button"
                            className="orderActionIconBtn details"
                            onClick={() => setSelected(o)}
                            title="عرض تفاصيل الأوردر الكاملة"
                            aria-label="عرض تفاصيل الأوردر"
                          >
                            <Eye size={17} />
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

      {/* Order Details Modal */}
      {selected && (
        <div className="adminModalBackdrop">
          <section className="adminModal orderModal">
            <div className="adminModalHead">
              <div>
                <p>تفاصيل الأوردر {selected.orderNumber}</p>
                <h2>
                  {selected.customer.firstName} {selected.customer.lastName}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="إغلاق">
                <X />
              </button>
            </div>

            {/* Customer Communication & Blacklist Bar */}
            <div className="orderCommBar">
              <div className="orderCommInfo">
                <span style={{ fontSize: "14px" }}>
                  رقم العميل: <strong dir="ltr">{selected.customer.phone}</strong>
                </span>
                {contactedIds.has(selected.id) && (
                  <span className="adminContactedBadge">✓ تم التواصل واتساب</span>
                )}
                {isPhoneBlocked(selected.customer.phone, blockedPhones) && (
                  <span className="adminBlockedBadge">⚠️ هذا الرقم محظور من الطلب</span>
                )}
              </div>
              <div className="orderCommButtons">
                {toWhatsAppNumber(selected.customer.phone) && (
                  <button
                    type="button"
                    onClick={() => {
                      const waNum = toWhatsAppNumber(selected.customer.phone);
                      if (waNum) {
                        const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(
                          formatWhatsAppMessage(selected)
                        )}`;
                        handleWhatsAppClick(selected, waUrl);
                      }
                    }}
                    className="adminWaBtn"
                  >
                    <MessageSquare size={16} />
                    مراسلة واتساب (تأكيد الأوردر)
                  </button>
                )}
                <a
                  href={`tel:${normalizePhone(selected.customer.phone)}`}
                  className="adminCallBtn"
                >
                  <Phone size={15} />
                  اتصال هاتفي
                </a>
                {isPhoneBlocked(selected.customer.phone, blockedPhones) ? (
                  <button
                    type="button"
                    disabled={busyPhone}
                    onClick={() => handleToggleBlock(selected.customer.phone, false)}
                    className="adminUnblockBtn"
                  >
                    <ShieldCheck size={15} />
                    فك حظر الرقم
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyPhone}
                    onClick={() => handleToggleBlock(selected.customer.phone, true)}
                    className="adminBlockBtn"
                  >
                    <ShieldAlert size={15} />
                    حظر هذا الرقم ⛔
                  </button>
                )}
              </div>
            </div>

            <div className="orderAdminDetails">
              <div>
                <span>الهاتف والبريد</span>
                <strong>
                  <span dir="ltr">{selected.customer.phone}</span>
                  <br />
                  <small style={{ color: "var(--muted)", fontWeight: "normal" }}>
                    {selected.customer.email || "لم يتم إدخال بريد"}
                  </small>
                </strong>
              </div>
              <div>
                <span>عنوان التوصيل</span>
                <strong>
                  {selected.shipping.governorate} · {selected.shipping.city}
                  <br />
                  {selected.shipping.street}
                </strong>
              </div>
              <div>
                <span>طريقة الدفع</span>
                <strong>
                  {selected.paymentMethod === "COD" ? "الدفع كاش عند الاستلام" : selected.paymentMethod}
                  <br />
                  <small style={{ color: "var(--muted)", fontWeight: "normal" }}>
                    الحالة: {selected.paymentStatus === "PENDING" ? "في انتظار الاستلام كاش" : selected.paymentStatus}
                  </small>
                </strong>
              </div>
              <div>
                <span>إجمالي المبلغ</span>
                <strong style={{ fontSize: "16px", color: "#161714" }}>{formatPrice(selected.grandTotal)}</strong>
                <small style={{ color: "var(--muted)", display: "block" }}>
                  شحن: {formatPrice(selected.shippingTotal)}{" "}
                  {selected.discountTotal > 0 && `· خصم: ${formatPrice(selected.discountTotal)}`}
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
              <strong style={{ padding: "10px 0 5px", fontSize: "14px" }}>القطع المطلوبة بالأوردر:</strong>
              {selected.items.map((item) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.quantity}× {item.productName}</strong>
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
              <strong>سجل التحديثات للطلب (Status History)</strong>
              {[...selected.statusEvents].reverse().map((event, i) => (
                <div key={`${event.createdAt}-${i}`}>
                  <span>{label(event.status)}</span>
                  <small>
                    {new Date(event.createdAt).toLocaleString("ar-EG")}{" "}
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
