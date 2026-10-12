import { formatPrice } from "@/lib/format";
import { getCustomers } from "@/server/store-db";
import { toWhatsAppNumber } from "@/lib/phone";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>سجل وقاعدة بيانات العملاء (CRM)</p>
          <h1>العملاء</h1>
        </div>
        <span className="adminMetricChip">{customers.length} عميل مسجل</span>
      </div>

      <section className="adminPanel noPad">
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>العميل</th>
                <th>رقم الهاتف</th>
                <th>البريد الإلكتروني</th>
                <th>عدد الطلبات</th>
                <th>إجمالي المشتريات</th>
                <th>تاريخ آخر طلب</th>
                <th>تواصل</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                    لا يوجد عملاء مسجلون بعد.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const waNumber = toWhatsAppNumber(c.phone);
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>
                          {c.firstName} {c.lastName}
                        </strong>
                      </td>
                      <td>
                        <span dir="ltr" style={{ display: "inline-block" }}>{c.phone}</span>
                      </td>
                      <td>{c.email || "—"}</td>
                      <td>
                        <strong>{c.orderCount} طلبات</strong>
                      </td>
                      <td>{formatPrice(c.totalSpent)}</td>
                      <td>
                        {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("ar-EG") : "—"}
                      </td>
                      <td>
                        {waNumber ? (
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="orderWaQuickBtn"
                            title="مراسلة العميل عبر الواتساب"
                          >
                            <MessageSquare size={13} />
                            واتساب
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
