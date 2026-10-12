"use client";

import { FormEvent, useMemo, useState } from "react";
import type { InventoryMovementRecord } from "@/lib/domain";
import type { ProductVariant } from "@/lib/types";

type Row = ProductVariant & { productId: string; product: string };

export function AdminInventoryClient({
  initialRows,
  initialMovements,
  threshold
}: {
  initialRows: Row[];
  initialMovements: InventoryMovementRecord[];
  threshold: number;
}) {
  const [rows, setRows] = useState(initialRows);
  const [movements, setMovements] = useState(initialMovements);
  const [sku, setSku] = useState(initialRows[0]?.sku || "");
  const [error, setError] = useState("");

  const low = useMemo(
    () => rows.filter((r) => r.stock <= (r.lowStockAt ?? threshold)).length,
    [rows, threshold]
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        delta: Number(f.get("delta")),
        reason: f.get("reason"),
        reference: f.get("reference")
      })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error || "تعذر تعديل المخزون.");
    setRows((cur) => cur.map((row) => (row.sku === sku ? { ...row, stock: d.variant.stock } : row)));
    setMovements((cur) => [d.movement, ...cur]);
    (e.currentTarget.elements.namedItem("delta") as HTMLInputElement).value = "";
  }

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>إدارة وتتبع المستودع</p>
          <h1>المخزون</h1>
        </div>
        <span className="adminMetricChip">{low} قطع تحتاج لتزويد</span>
      </div>

      {error && <div className="adminAlert">{error}</div>}

      <div className="adminTwoCol inventoryTop">
        <section className="adminPanel">
          <div className="adminPanelHeading">
            <div>
              <h2>تعديل كمية المخزون يدويّاً</h2>
              <p>كل تعديل يتم تسجيله في سجل الحركات للتدقيق.</p>
            </div>
          </div>
          <form className="inventoryAdjustForm" onSubmit={submit}>
            <label>
              الموديل والمقاس المستهدف
              <select value={sku} onChange={(e) => setSku(e.target.value)}>
                {rows.map((r) => (
                  <option key={r.sku} value={r.sku}>
                    {r.sku} · {r.product} · {r.color} / مقاس {r.size}
                  </option>
                ))}
              </select>
            </label>
            <div className="adminFormGrid">
              <label>
                فارق الكمية (إضافة أو خصم)
                <input name="delta" type="number" required placeholder="مثال: +10 أو -2" />
              </label>
              <label>
                الرقم المرجعي (اختياري)
                <input name="reference" placeholder="مثال: فاتورة استلام / جرد مستودع" />
              </label>
            </div>
            <label>
              سبب التعديل
              <input name="reason" required placeholder="مثال: وصول شحنة جديدة، بضاعة تالفة، جرد دوري..." />
            </label>
            <button className="adminPrimary">تطبيق التعديل وحفظ الحركة</button>
          </form>
        </section>

        <section className="adminPanel">
          <div className="adminPanelHeading">
            <div>
              <h2>آخر حركات المخزون المسجلة</h2>
              <p>سجل المراجعة والتدقيق (Audit Trail)</p>
            </div>
          </div>
          <div className="movementList">
            {movements.length === 0 ? (
              <p style={{ color: "var(--muted)", padding: "12px 0" }}>لا توجد حركات مخزون مسجلة بعد.</p>
            ) : (
              movements.slice(0, 8).map((m) => (
                <div key={m.id}>
                  <span>
                    <strong>{m.sku}</strong>
                    <small>
                      {m.reason}
                      {m.reference ? ` · مرجع: ${m.reference}` : ""}
                    </small>
                  </span>
                  <b className={m.delta > 0 ? "positive" : "negative"}>
                    {m.delta > 0 ? "+" : ""}
                    {m.delta}
                  </b>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="adminPanel noPad">
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>كود SKU</th>
                <th>اسم المنتج</th>
                <th>اللون</th>
                <th>المقاس</th>
                <th>الكمية المتاحة</th>
                <th>حالة التوفر</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isLow = r.stock <= (r.lowStockAt ?? threshold);
                return (
                  <tr key={r.sku}>
                    <td>
                      <strong dir="ltr" style={{ textAlign: "right" }}>{r.sku}</strong>
                    </td>
                    <td>{r.product}</td>
                    <td>{r.color}</td>
                    <td>{r.size}</td>
                    <td>
                      <strong>{r.stock} قطعة</strong>
                    </td>
                    <td>
                      <span className={`stockState ${r.stock === 0 ? "cancelled" : isLow ? "low" : "ok"}`}>
                        {r.stock === 0 ? "نفدت الكمية" : isLow ? "مخزون منخفض" : "متوفر بشكل كافي"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
