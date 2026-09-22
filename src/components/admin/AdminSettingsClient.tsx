"use client";

import { FormEvent, useState } from "react";
import type { StoreSettings } from "@/lib/domain";
import { EGYPT_GOVERNORATES, getDefaultGovRates } from "@/lib/governorates";
import { Search, RotateCcw, Copy } from "lucide-react";

export function AdminSettingsClient({ initial }: { initial: StoreSettings }) {
  const [s, setS] = useState(initial);
  const [govRates, setGovRates] = useState<Record<string, number>>(() => {
    return initial.governorateRates && Object.keys(initial.governorateRates).length > 0
      ? { ...initial.governorateRates }
      : getDefaultGovRates();
  });
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function handleGovRateChange(nameEn: string, val: string) {
    const num = val === "" ? 0 : Math.max(0, Number(val));
    setGovRates((prev) => ({ ...prev, [nameEn]: num }));
  }

  function applyFlatRateToAll() {
    const next: Record<string, number> = {};
    for (const gov of EGYPT_GOVERNORATES) {
      next[gov.nameEn] = s.flatShippingRate;
    }
    setGovRates(next);
  }

  function resetToDefaults() {
    setGovRates(getDefaultGovRates());
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const payload = {
      ...s,
      governorateRates: govRates
    };
    const r = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Unable to save settings.");
    setS(d.settings);
    if (d.settings?.governorateRates) {
      setGovRates(d.settings.governorateRates);
    }
    setMsg("Settings and governorate shipping rates saved successfully.");
  }

  const filteredGovs = EGYPT_GOVERNORATES.filter((gov) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      gov.nameEn.toLowerCase().includes(term) ||
      gov.nameAr.includes(term)
    );
  });

  return (
    <>
      <div className="adminPageHeading">
        <div>
          <p>Configuration</p>
          <h1>Settings</h1>
        </div>
      </div>

      {msg && <div className="adminAlert success">{msg}</div>}

      <form className="adminPanel adminSettingsForm" onSubmit={submit}>
        <div className="adminPanelHeading">
          <div>
            <h2>General Shipping & Payments</h2>
            <p>These values are used by checkout immediately.</p>
          </div>
        </div>

        <div className="adminFormGrid">
          <label>
            Default / Flat shipping rate (EGP)
            <input
              type="number"
              min="0"
              value={s.flatShippingRate}
              onChange={(e) => setS({ ...s, flatShippingRate: Number(e.target.value) })}
            />
          </label>
          <label>
            Free shipping threshold (EGP)
            <input
              type="number"
              min="0"
              value={s.freeShippingThreshold}
              onChange={(e) => setS({ ...s, freeShippingThreshold: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="adminFormGrid">
          <label>
            Low stock threshold
            <input
              type="number"
              min="0"
              value={s.lowStockThreshold}
              onChange={(e) => setS({ ...s, lowStockThreshold: Number(e.target.value) })}
            />
          </label>
          <label>
            Currency
            <input value={s.currency} disabled />
          </label>
        </div>

        <div className="adminChecks large">
          <label>
            <input
              type="checkbox"
              checked={s.codEnabled}
              onChange={(e) => setS({ ...s, codEnabled: e.target.checked })}
            />{" "}
            Cash on delivery
          </label>
          <label>
            <input
              type="checkbox"
              checked={s.cardEnabled}
              onChange={(e) => setS({ ...s, cardEnabled: e.target.checked })}
            />{" "}
            Online card payments
          </label>
        </div>

        <div className="adminFormGrid">
          <label>
            Support phone
            <input
              value={s.supportPhone}
              onChange={(e) => setS({ ...s, supportPhone: e.target.value })}
            />
          </label>
          <label>
            Support email
            <input
              type="email"
              value={s.supportEmail}
              onChange={(e) => setS({ ...s, supportEmail: e.target.value })}
            />
          </label>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid var(--line)", margin: "24px 0" }} />

        <div className="adminPanelHeading">
          <div>
            <h2>Governorate Shipping Rates (أسعار شحن المحافظات)</h2>
            <p>
              حدد سعر الشحن المخصص لكل محافظة من محافظات مصر. السعر ده بيظهر ويتحسب للعميل في الـ Checkout بمجرد اختيار محافظته.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "220px" }}>
            <input
              type="text"
              placeholder="Search governorate / ابحث عن محافظة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "32px", width: "100%" }}
            />
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          </div>
          <button
            type="button"
            onClick={applyFlatRateToAll}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 12px", fontSize: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer" }}
          >
            <Copy size={13} /> ضبط الكل بالسعر الافتراضي ({s.flatShippingRate} ج.م)
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 12px", fontSize: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer" }}
          >
            <RotateCcw size={13} /> استرجاع التسعير المقترح لمصر
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "12px",
            maxHeight: "440px",
            overflowY: "auto",
            padding: "12px",
            background: "rgba(0,0,0,0.2)",
            borderRadius: "8px",
            border: "1px solid var(--line)"
          }}
        >
          {filteredGovs.map((gov) => {
            const currentVal = govRates[gov.nameEn] ?? gov.defaultRate;
            return (
              <div
                key={gov.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "10px",
                  borderRadius: "6px",
                  background: "var(--panel-2, #20221e)",
                  border: "1px solid var(--line)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "600", fontSize: "13px" }}>{gov.nameEn}</span>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{gov.nameAr}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <input
                    type="number"
                    min="0"
                    value={currentVal}
                    onChange={(e) => handleGovRateChange(gov.nameEn, e.target.value)}
                    style={{ flex: "1", padding: "6px 8px", fontSize: "13px" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>EGP</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="settingsNote" style={{ marginTop: "18px" }}>
          Card payments remain disabled until a payment gateway is integrated. Turning the switch on only exposes the checkout option.
        </p>

        <button className="adminPrimary" disabled={busy} style={{ marginTop: "12px" }}>
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>
    </>
  );
}
