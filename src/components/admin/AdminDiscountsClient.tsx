"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { AdminProduct, DiscountRecord } from "@/lib/domain";

function stateOf(d: DiscountRecord) {
  const now = Date.now();
  if (!d.active) return "مسودة";
  if (d.startsAt && new Date(d.startsAt).getTime() > now) return "مجدول";
  if (d.endsAt && new Date(d.endsAt).getTime() < now) return "منتهي";
  return "نشط";
}

export function AdminDiscountsClient({
  initialDiscounts,
  products
}: {
  initialDiscounts: DiscountRecord[];
  products: AdminProduct[];
}) {
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const scope = String(f.get("scope")) as DiscountRecord["scope"];
    const target = String(f.get("target") || "");
    const r = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.get("name"),
        code: f.get("code") || undefined,
        type: f.get("type"),
        value: Number(f.get("value")),
        scope,
        targetIds: target ? [target] : [],
        minSubtotal: f.get("minSubtotal") ? Number(f.get("minSubtotal")) : undefined,
        startsAt: f.get("startsAt") || undefined,
        endsAt: f.get("endsAt") || undefined,
        usageLimit: f.get("usageLimit") ? Number(f.get("usageLimit")) : undefined,
        active: true
      })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error || "تعذر إنشاء الخصم.");
    setDiscounts((cur) => [d.discount, ...cur]);
    setOpen(false);
  }

  async function toggle(d: DiscountRecord) {
    const r = await fetch(`/api/admin/discounts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !d.active })
    });
    const data = await r.json();
    if (r.ok) setDiscounts((cur) => cur.map((x) => (x.id === d.id ? data.discount : x)));
  }

  async function remove(d: DiscountRecord) {
    if (!confirm(`هل أنت متأكد من حذف الخصم (${d.name})؟`)) return;
    const r = await fetch(`/api/admin/discounts/${d.id}`, { method: "DELETE" });
    if (r.ok) setDiscounts((cur) => cur.filter((x) => x.id !== d.id));
  }

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>العروض والحملات الترويجية</p>
          <h1>الخصومات والكوبونات</h1>
        </div>
        <button className="adminPrimary" onClick={() => setOpen(true)}>
          <Plus size={15} /> إنشاء خصم جديد
        </button>
      </div>

      {error && <div className="adminAlert">{error}</div>}

      <div className="discountGrid">
        {discounts.length === 0 ? (
          <p style={{ color: "var(--muted)", padding: "20px" }}>لا توجد كوبونات أو خصومات حالياً.</p>
        ) : (
          discounts.map((d) => {
            const state = stateOf(d);
            return (
              <article className={`discountCard ${!d.active ? "muted" : ""}`} key={d.id}>
                <div>
                  <span
                    className={`adminStatus ${
                      state === "نشط" ? "delivered" : state === "مجدول" ? "preparing" : ""
                    }`}
                  >
                    {state}
                  </span>
                  <small>{d.code ? "كود كوبون" : `خصم تلقائي`}</small>
                </div>
                <h2>{d.code || d.name}</h2>
                <p>
                  {d.type === "PERCENTAGE" ? `خصم ${d.value}%` : `خصم ${d.value} ج.م`} ·{" "}
                  {d.scope === "ORDER" ? "على إجمالي الطلب" : d.scope === "PRODUCT" ? "على منتج محدد" : "على كولكشن"}
                </p>
                <footer>
                  <span>
                    {d.startsAt ? new Date(d.startsAt).toLocaleDateString("ar-EG") : "ساري الآن"} ←{" "}
                    {d.endsAt ? new Date(d.endsAt).toLocaleDateString("ar-EG") : "مستمر"}
                  </span>
                  <div className="discountActions">
                    <button onClick={() => toggle(d)}>{d.active ? "إيقاف مؤقت" : "تفعيل"}</button>
                    <button onClick={() => remove(d)} title="حذف الخصم">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </footer>
              </article>
            );
          })
        )}
      </div>

      {open && (
        <div className="adminModalBackdrop">
          <section className="adminModal">
            <div className="adminModalHead">
              <div>
                <p>العروض الترويجية</p>
                <h2>إنشاء خصم أو كوبون جديد</h2>
              </div>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <form className="adminEditorForm" onSubmit={create}>
              <label>
                اسم العرض / الخصم *
                <input name="name" required placeholder="مثال: خصم افتتاح الويك إند" />
              </label>
              <div className="adminFormGrid">
                <label>
                  كود الكوبون (اختياري)
                  <input name="code" placeholder="مثال: A2WEEKEND" dir="ltr" />
                </label>
                <label>
                  نطاق تطبيق الخصم
                  <select name="scope" defaultValue="ORDER">
                    <option value="ORDER">على كامل الأوردر</option>
                    <option value="PRODUCT">على منتج معين</option>
                    <option value="COLLECTION">على كولكشن بالكامل</option>
                  </select>
                </label>
              </div>
              <div className="adminFormGrid">
                <label>
                  نوع الخصم
                  <select name="type">
                    <option value="PERCENTAGE">نسبة مئوية (%)</option>
                    <option value="FIXED_AMOUNT">مبلغ ثابت (ج.م)</option>
                  </select>
                </label>
                <label>
                  قيمة الخصم *
                  <input name="value" type="number" min="1" required placeholder="مثال: 15 أو 200" />
                </label>
              </div>
              <label>
                المنتج أو المجموعة المستهدفة
                <select name="target">
                  <option value="">كافة المنتجات</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      منتج: {p.name}
                    </option>
                  ))}
                  {Array.from(new Set(products.map((p) => p.collection))).map((c) => (
                    <option key={c} value={c}>
                      كولكشن: {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="adminFormGrid">
                <label>
                  الحد الأدنى لقيمة السلة (ج.م)
                  <input name="minSubtotal" type="number" min="0" placeholder="مثال: 1000" />
                </label>
                <label>
                  حد أقصى لعدد مرات الاستخدام
                  <input name="usageLimit" type="number" min="1" placeholder="مثال: 50" />
                </label>
              </div>
              <div className="adminFormGrid">
                <label>
                  تاريخ وتوقيت البدء
                  <input name="startsAt" type="datetime-local" />
                </label>
                <label>
                  تاريخ وتوقيت الانتهاء
                  <input name="endsAt" type="datetime-local" />
                </label>
              </div>
              <div className="adminModalActions">
                <button type="button" onClick={() => setOpen(false)}>
                  إلغاء
                </button>
                <button className="adminPrimary">تأكيد وإنشاء الخصم</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
