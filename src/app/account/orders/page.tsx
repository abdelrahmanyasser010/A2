"use client";

import { OrderLookupClient } from "@/components/OrderLookupClient";

export default function OrdersPage() {
  return (
    <div className="pageShell" style={{ minHeight: "85vh", paddingTop: "calc(var(--header-h) + 16px)" }}>
      <OrderLookupClient />
    </div>
  );
}
