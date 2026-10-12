import Link from "next/link";
import { ArrowLeft, PackageCheck, ShoppingBag, TriangleAlert, WalletCards } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getDashboardMetrics } from "@/server/store-db";

export const dynamic = "force-dynamic";

const statusArabicMap: Record<string, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PREPARING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
  RETURN_REQUESTED: "طلب إرجاع",
  RETURNED: "مرتجع",
  REFUNDED: "مسترجع"
};

const label = (v: string) => statusArabicMap[v] || v;

export default async function AdminDashboard() {
  const data = await getDashboardMetrics();

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>
            {new Date().toLocaleDateString("ar-EG", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </p>
          <h1>نظرة عامة</h1>
        </div>
        <Link href="/admin/products" className="adminPrimary">
          + إضافة منتج جديد
        </Link>
      </div>

      <section className="statGrid">
        <div className="statCard">
          <span>
            <WalletCards size={19} />
            مبيعات اليوم
          </span>
          <strong>{formatPrice(data.todayRevenue)}</strong>
          <small>إجمالي الإيرادات المسجلة: {formatPrice(data.revenue)}</small>
        </div>
        <div className="statCard">
          <span>
            <ShoppingBag size={19} />
            طلبات جديدة
          </span>
          <strong>{data.newOrders}</strong>
          <small>{data.todayOrders} طلب تم تسجيله اليوم</small>
        </div>
        <div className="statCard">
          <span>
            <PackageCheck size={19} />
            قطع في المخزن
          </span>
          <strong>{data.unitsInStock}</strong>
          <small>إجمالي كافة المقاسات والألوان</small>
        </div>
        <div className="statCard warning">
          <span>
            <TriangleAlert size={19} />
            مخزون منخفض
          </span>
          <strong>{data.lowStock}</strong>
          <small>قطع تحتاج لإعادة طلب وتزويد</small>
        </div>
      </section>

      <section className="adminPanel">
        <div className="adminPanelHeading">
          <div>
            <h2>أحدث الطلبات</h2>
            <p>بيانات الطلبات الواردة مباشرة من المتجر.</p>
          </div>
          <Link href="/admin/orders">
            عرض كل الطلبات <ArrowLeft size={15} />
          </Link>
        </div>
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>عدد القطع</th>
                <th>طريقة الدفع</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                    لا توجد طلبات مسجلة بعد.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.orderNumber}</strong>
                      <small>{new Date(o.createdAt).toLocaleString("ar-EG")}</small>
                    </td>
                    <td>
                      {o.customer.firstName} {o.customer.lastName}
                    </td>
                    <td>{o.items.reduce((s, i) => s + i.quantity, 0)} قطعة</td>
                    <td>{o.paymentMethod === "COD" ? "كاش عند الاستلام" : o.paymentMethod}</td>
                    <td>
                      <strong>{formatPrice(o.grandTotal)}</strong>
                    </td>
                    <td>
                      <span className={`adminStatus ${o.status.toLowerCase()}`}>
                        {label(o.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="adminTwoCol">
        <section className="adminPanel">
          <div className="adminPanelHeading">
            <div>
              <h2>الأكثر طلباً ومبيعاً</h2>
              <p>مرتبة حسب عدد القطع المباعة</p>
            </div>
          </div>
          {data.topProducts.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>لا توجد مبيعات مسجلة حتى الآن.</p>
          ) : (
            data.topProducts.map((p, i) => (
              <div className="rankRow" key={p.id}>
                <span>0{i + 1}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>
                    {p.category} · {p.qty} قطعة مباعة
                  </small>
                </div>
                <b>{formatPrice(p.revenue)}</b>
              </div>
            ))
          )}
        </section>

        <section className="adminPanel">
          <div className="adminPanelHeading">
            <div>
              <h2>حالة المتجر والتشغيل</h2>
              <p>نظرة عامة على البيانات</p>
            </div>
          </div>
          <div className="opsList">
            <div>
              <i />
              {data.customerCount} عميل مسجل في قاعدة البيانات
            </div>
            <div>
              <i />
              {data.orderCount} طلب تم تنفيذه بالمتجر
            </div>
            <div>
              <i />
              {data.lowStock} مقاسات في المخزن وصلت للحد الأدنى أو نفدت
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
