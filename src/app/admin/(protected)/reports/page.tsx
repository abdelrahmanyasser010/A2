import { formatPrice } from "@/lib/format";
import { getDashboardMetrics, getOrders } from "@/server/store-db";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [m, orders] = await Promise.all([getDashboardMetrics(), getOrders()]);
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const returns = orders.filter((o) =>
    ["RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(o.status)
  ).length;
  const avg = orders.length
    ? Math.round(orders.reduce((s, o) => s + o.grandTotal, 0) / orders.length)
    : 0;

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>تحليلات ومؤشرات أداء المبيعات</p>
          <h1>التقارير المالية والتشغيلية</h1>
        </div>
      </div>

      <section className="statGrid">
        <div className="statCard">
          <span>إجمالي الإيرادات المسجلة</span>
          <strong>{formatPrice(m.revenue)}</strong>
          <small>باستثناء الطلبات الملغية والمرتجعة</small>
        </div>
        <div className="statCard">
          <span>متوسط قيمة الأوردر</span>
          <strong>{formatPrice(avg)}</strong>
          <small>من واقع {orders.length} أوردر مسجل</small>
        </div>
        <div className="statCard">
          <span>تم تسليمها بنجاح</span>
          <strong>{delivered}</strong>
          <small>طلبات مكتملة الشحن والتسليم</small>
        </div>
        <div className="statCard warning">
          <span>ملغي ومرتجع</span>
          <strong>{returns + cancelled}</strong>
          <small>
            {returns} طلب مرتجع · {cancelled} ملغي
          </small>
        </div>
      </section>

      <section className="adminPanel">
        <div className="adminPanelHeading">
          <div>
            <h2>المنتجات الأكثر مبيعاً وتحقيقاً للأرباح</h2>
            <p>مرتبة حسب عدد القطع المسلمة وإجمالي العائد المادي.</p>
          </div>
        </div>
        {m.topProducts.length === 0 ? (
          <p style={{ color: "var(--muted)", padding: "16px 0" }}>لا توجد مبيعات مسجلة حتى الآن.</p>
        ) : (
          m.topProducts.map((p, i) => (
            <div className="rankRow" key={p.id}>
              <span>0{i + 1}</span>
              <div>
                <strong>{p.name}</strong>
                <small>{p.qty} قطعة مباعة</small>
              </div>
              <b>{formatPrice(p.revenue)}</b>
            </div>
          ))
        )}
      </section>
    </>
  );
}
