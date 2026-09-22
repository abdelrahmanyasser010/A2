import Link from "next/link";
import { ArrowUpRight, PackageCheck, ShoppingBag, TriangleAlert, WalletCards } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getDashboardMetrics } from "@/server/store-db";

export const dynamic = "force-dynamic";
const label=(v:string)=>v.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());

export default async function AdminDashboard() {
  const data=await getDashboardMetrics();
  return <>
    <div className="adminPageHeading"><div><p>{new Date().toLocaleDateString("en-EG",{weekday:"long",day:"numeric",month:"long"})}</p><h1>Overview</h1></div><Link href="/admin/products" className="adminPrimary">+ Add product</Link></div>
    <section className="statGrid">
      <div className="statCard"><span><WalletCards size={19}/>Today&apos;s sales</span><strong>{formatPrice(data.todayRevenue)}</strong><small>{formatPrice(data.revenue)} total recorded revenue</small></div>
      <div className="statCard"><span><ShoppingBag size={19}/>New orders</span><strong>{data.newOrders}</strong><small>{data.todayOrders} orders placed today</small></div>
      <div className="statCard"><span><PackageCheck size={19}/>Units in stock</span><strong>{data.unitsInStock}</strong><small>Across all variants</small></div>
      <div className="statCard warning"><span><TriangleAlert size={19}/>Low stock</span><strong>{data.lowStock}</strong><small>Variant combinations need attention</small></div>
    </section>
    <section className="adminPanel"><div className="adminPanelHeading"><div><h2>Recent orders</h2><p>Live order data from the store repository.</p></div><Link href="/admin/orders">View all <ArrowUpRight size={15}/></Link></div><div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead><tbody>{data.recentOrders.map(o=><tr key={o.id}><td><strong>{o.orderNumber}</strong><small>{new Date(o.createdAt).toLocaleString("en-EG")}</small></td><td>{o.customer.firstName} {o.customer.lastName}</td><td>{o.items.reduce((s,i)=>s+i.quantity,0)}</td><td>{o.paymentMethod}</td><td>{formatPrice(o.grandTotal)}</td><td><span className={`adminStatus ${o.status.toLowerCase()}`}>{label(o.status)}</span></td></tr>)}</tbody></table></div></section>
    <div className="adminTwoCol"><section className="adminPanel"><div className="adminPanelHeading"><div><h2>Top products</h2><p>By units sold</p></div></div>{data.topProducts.map((p,i)=><div className="rankRow" key={p.id}><span>0{i+1}</span><div><strong>{p.name}</strong><small>{p.category} · {p.qty} units</small></div><b>{formatPrice(p.revenue)}</b></div>)}</section><section className="adminPanel"><div className="adminPanelHeading"><div><h2>Store health</h2><p>Operational snapshot</p></div></div><div className="opsList"><div><i/>{data.customerCount} customers in CRM</div><div><i/>{data.orderCount} orders recorded</div><div><i/>{data.lowStock} variants at or below threshold</div></div></section></div>
  </>;
}
