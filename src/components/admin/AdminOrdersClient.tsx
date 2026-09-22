"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { OrderRecord, OrderStatus } from "@/lib/domain";
import { formatPrice } from "@/lib/format";

const statuses: OrderStatus[] = ["NEW","CONFIRMED","PREPARING","SHIPPED","DELIVERED","CANCELLED","RETURN_REQUESTED","RETURNED","REFUNDED"];
const label = (value:string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, m=>m.toUpperCase());

export function AdminOrdersClient({ initialOrders }: { initialOrders: OrderRecord[] }) {
  const [orders,setOrders]=useState(initialOrders);
  const [tab,setTab]=useState("ALL");
  const [selected,setSelected]=useState<OrderRecord|null>(null);
  const [message,setMessage]=useState("");
  const visible=useMemo(()=>tab==="ALL"?orders:orders.filter(o=>o.status===tab),[orders,tab]);

  async function changeStatus(order:OrderRecord,status:OrderStatus){
    setMessage("");
    const r=await fetch(`/api/admin/orders/${order.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) return setMessage(d.error||"Unable to update order.");
    setOrders(cur=>cur.map(o=>o.id===d.order.id?d.order:o));
    setSelected(d.order);
  }
  return <>
    <div className="adminPageHeading"><div><p>Fulfilment</p><h1>Orders</h1></div><button className="adminPrimary" onClick={()=>window.print()}>Export / print</button></div>
    {message&&<div className="adminAlert">{message}</div>}
    <section className="adminPanel noPad">
      <div className="orderTabs">{["ALL","NEW","PREPARING","SHIPPED","RETURN_REQUESTED"].map(s=><button key={s} className={tab===s?"active":""} onClick={()=>setTab(s)}>{label(s)} <span>{s==="ALL"?orders.length:orders.filter(o=>o.status===s).length}</span></button>)}</div>
      <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Payment</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>{visible.map(o=><tr key={o.id}><td><strong>{o.orderNumber}</strong></td><td>{o.customer.firstName} {o.customer.lastName}<small>{o.customer.phone}</small></td><td>{new Date(o.createdAt).toLocaleDateString("en-EG")}</td><td>{o.paymentMethod}</td><td>{formatPrice(o.grandTotal)}</td><td><span className={`adminStatus ${o.status.toLowerCase()}`}>{label(o.status)}</span></td><td><button className="tableAction" onClick={()=>setSelected(o)}>Open</button></td></tr>)}</tbody></table></div>
    </section>
    {selected&&<div className="adminModalBackdrop"><section className="adminModal orderModal"><div className="adminModalHead"><div><p>{selected.orderNumber}</p><h2>{selected.customer.firstName} {selected.customer.lastName}</h2></div><button onClick={()=>setSelected(null)}><X/></button></div>
      <div className="orderAdminDetails"><div><span>Phone</span><strong>{selected.customer.phone}</strong></div><div><span>Address</span><strong>{selected.shipping.governorate} · {selected.shipping.city}<br/>{selected.shipping.street}</strong></div><div><span>Payment</span><strong>{selected.paymentMethod} / {selected.paymentStatus}</strong></div><div><span>Total</span><strong>{formatPrice(selected.grandTotal)}</strong></div></div>
      <div className="orderItemsAdmin">{selected.items.map(item=><div key={item.id}><span>{item.quantity}× {item.productName}<small>{item.color} / {item.size} · {item.sku}</small></span><strong>{formatPrice(item.lineTotal)}</strong></div>)}</div>
      <label className="statusSelectLabel">Order status<select value={selected.status} onChange={e=>changeStatus(selected,e.target.value as OrderStatus)}>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label>
      <div className="statusHistory"><strong>Status history</strong>{[...selected.statusEvents].reverse().map((event,i)=><div key={`${event.createdAt}-${i}`}><span>{label(event.status)}</span><small>{new Date(event.createdAt).toLocaleString("en-EG")} {event.note?`· ${event.note}`:""}</small></div>)}</div>
    </section></div>}
  </>;
}
