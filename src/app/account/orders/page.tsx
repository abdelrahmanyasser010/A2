"use client";

import { OrderLookupClient } from "@/components/OrderLookupClient";
import { useStore } from "@/components/StoreProvider";

export default function OrdersPage() {
  const { t } = useStore();

  return (
    <div className="pageShell accountPage">
      <header className="pageHero compactHero">
        <p className="eyebrow">{t("accountEyebrow")}</p>
        <h1>{t("trackOrderHeader")}</h1>
        <p>{t("trackOrderSubtitle")}</p>
      </header>
      <OrderLookupClient />
    </div>
  );
}
