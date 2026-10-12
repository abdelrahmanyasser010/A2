"use client";

import { FormEvent, useState } from "react";
import type { StoreSettings } from "@/lib/domain";
import { EGYPT_GOVERNORATES, getDefaultGovRates } from "@/lib/governorates";
import { Search, RotateCcw, Copy, ShieldAlert, Trash2 } from "lucide-react";
import { normalizePhone } from "@/lib/phone";

export function AdminSettingsClient({ initial }: { initial: StoreSettings }) {
  const [s, setS] = useState({ ...initial, blockedPhones: initial.blockedPhones || [] });
  const [newBlockedPhone, setNewBlockedPhone] = useState("");
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
    if (!r.ok) return setMsg(d.error || "تعذر حفظ الإعدادات.");
    setS(d.settings);
    if (d.settings?.governorateRates) {
      setGovRates(d.settings.governorateRates);
    }
    setMsg("تم حفظ الإعدادات وأسعار شحن المحافظات بنجاح.");
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
          <p>إعدادات النظام والتشغيل</p>
          <h1>إعدادات المتجر</h1>
        </div>
      </div>

      {msg && <div className="adminAlert success">{msg}</div>}

      <form className="adminPanel adminSettingsForm" onSubmit={submit}>
        <div className="adminPanelHeading">
          <div>
            <h2>الشحن وبوابات الدفع</h2>
            <p>هذه القيم تُطبق فوراً على صفحة الـ Checkout عند طلب العميل.</p>
          </div>
        </div>

        <div className="adminFormGrid">
          <label>
            سعر الشحن الموحد / الافتراضي (ج.م)
            <input
              type="number"
              min="0"
              value={s.flatShippingRate}
              onChange={(e) => setS({ ...s, flatShippingRate: Number(e.target.value) })}
            />
          </label>
          <label>
            الحد الأدنى للشحن المجاني (ج.م)
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
            تنبيه الحد الأدنى للمخزون (القطع)
            <input
              type="number"
              min="0"
              value={s.lowStockThreshold}
              onChange={(e) => setS({ ...s, lowStockThreshold: Number(e.target.value) })}
            />
          </label>
          <label>
            العملة
            <input value="جنيه مصري (EGP)" disabled />
          </label>
        </div>

        <div className="adminChecks large">
          <label>
            <input
              type="checkbox"
              checked={s.codEnabled}
              onChange={(e) => setS({ ...s, codEnabled: e.target.checked })}
            />{" "}
            تفعيل الدفع عند الاستلام (كاش)
          </label>
          <label>
            <input
              type="checkbox"
              checked={s.cardEnabled}
              onChange={(e) => setS({ ...s, cardEnabled: e.target.checked })}
            />{" "}
            تفعيل الدفع بالفيزا / البطاقات البنكية
          </label>
        </div>

        <div className="adminFormGrid">
          <label>
            هاتف خدمة العملاء والدعم
            <input
              value={s.supportPhone}
              onChange={(e) => setS({ ...s, supportPhone: e.target.value })}
              placeholder="010xxxxxxxx"
              dir="ltr"
            />
          </label>
          <label>
            البريد الإلكتروني للدعم
            <input
              type="email"
              value={s.supportEmail}
              onChange={(e) => setS({ ...s, supportEmail: e.target.value })}
              placeholder="support@a2.com"
              dir="ltr"
            />
          </label>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid var(--line)", margin: "24px 0" }} />

        <div className="adminPanelHeading">
          <div>
            <h2>أسعار شحن المحافظات المصرية</h2>
            <p>
              حدد سعر الشحن المخصص لكل محافظة. السعر ده بيظهر ويتحسب للعميل في الـ Checkout بمجرد اختيار محافظته.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "220px" }}>
            <input
              type="text"
              placeholder="ابحث عن محافظة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: "32px", width: "100%" }}
            />
            <Search size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
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
                  <span style={{ fontWeight: "600", fontSize: "13px" }}>{gov.nameAr}</span>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{gov.nameEn}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <input
                    type="number"
                    min="0"
                    value={currentVal}
                    onChange={(e) => handleGovRateChange(gov.nameEn, e.target.value)}
                    style={{ flex: "1", padding: "6px 8px", fontSize: "13px" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>ج.م</span>
                </div>
              </div>
            );
          })}
        </div>

        <hr style={{ border: "0", borderTop: "1px solid var(--line)", margin: "24px 0" }} />

        <div className="adminPanelHeading">
          <div>
            <h2>قائمة الأرقام المحظورة (Phone Blacklist)</h2>
            <p>
              الأرقام المضافة هنا يتم منعها تلقائياً عند محاولة إتمام الطلب من صفحة الـ Checkout مع رسالة توضيحية.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
          <input
            type="tel"
            placeholder="أدخل رقم الموبايل للحظر (مثال: 01012345678)"
            value={newBlockedPhone}
            onChange={(e) => setNewBlockedPhone(e.target.value)}
            style={{ maxWidth: "320px", padding: "8px 12px" }}
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => {
              const norm = normalizePhone(newBlockedPhone);
              if (!norm) return;
              const current = s.blockedPhones || [];
              if (!current.includes(norm)) {
                setS({ ...s, blockedPhones: [...current, norm] });
              }
              setNewBlockedPhone("");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              fontSize: "13px",
              background: "#b91c1c",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            <ShieldAlert size={14} /> إضافة للحظر
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "36px" }}>
          {(!s.blockedPhones || s.blockedPhones.length === 0) ? (
            <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>
              لا توجد أرقام محظورة حالياً. يمكنك أيضاً حظر أي رقم مباشرة من نافذة تفاصيل الأوردر.
            </p>
          ) : (
            s.blockedPhones.map((phone) => (
              <span
                key={phone}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(220, 38, 38, 0.15)",
                  border: "1px solid rgba(220, 38, 38, 0.4)",
                  color: "#f87171",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontFamily: "monospace"
                }}
              >
                <span dir="ltr">{phone}</span>
                <button
                  type="button"
                  title="فك الحظر"
                  onClick={() => {
                    setS({
                      ...s,
                      blockedPhones: (s.blockedPhones || []).filter((p) => p !== phone)
                    });
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    cursor: "pointer",
                    padding: "0 2px",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))
          )}
        </div>

        <p className="settingsNote" style={{ marginTop: "24px" }}>
          الدفع بالبطاقات يظل معطلاً حتى يتم تفعيل وربط بوابة الدفع البنكية مستقبلاً.
        </p>

        <button className="adminPrimary" disabled={busy} style={{ marginTop: "12px" }}>
          {busy ? "جاري الحفظ…" : "حفظ الإعدادات"}
        </button>
      </form>
    </>
  );
}
