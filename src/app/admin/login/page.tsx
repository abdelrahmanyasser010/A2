"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, Loader2, KeyRound, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@a2.local");
  const [password, setPassword] = useState("");

  function fillDemo() {
    setEmail("admin@a2.local");
    setPassword("A2admin2026");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLoading(false);
        return setError(data.error || "بيانات الدخول غير صحيحة. يرجى التأكد والمحاولة مجدداً.");
      }
      // Keep loading active so spinner does not stop until admin dashboard opens
      window.location.href = "/admin";
    } catch {
      setLoading(false);
      setError("تعذر الاتصال بالخادم، يرجى إعادة المحاولة.");
    }
  }

  return (
    <main className="adminLoginNewPage" dir="rtl">
      <div className="adminLoginGlow" />
      <div className="adminLoginGlowSecondary" />

      <section className="adminLoginCardNew">
        <header className="adminLoginHeaderNew">
          <Link href="/" className="adminBrandBadge" title="العودة للمتجر">
            <span className="brandSymbol">A²</span>
            <span className="brandRole">STORE OPS</span>
          </Link>
          <h1>لوحة الإدارة والتشغيل</h1>
          <p>سجّل الدخول للوصول إلى الطلبات، المخزون، والمنتجات</p>
        </header>

        <form onSubmit={submit} className="adminLoginFormNew">
          <div className="loginField">
            <label htmlFor="admin-email">البريد الإلكتروني</label>
            <div className="loginInputWrap">
              <Mail className="loginInputIcon right" size={17} />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@a2.local"
                dir="ltr"
              />
            </div>
          </div>

          <div className="loginField">
            <label htmlFor="admin-pass">كلمة المرور</label>
            <div className="loginInputWrap">
              <Lock className="loginInputIcon right" size={17} />
              <input
                id="admin-pass"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                dir="ltr"
              />
              <button
                type="button"
                className="togglePassBtn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="loginAlertErrorNew">{error}</div>}

          <button className="loginSubmitBtnNew" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spinIcon" size={18} /> جاري الدخول للوحة التحكم…
              </>
            ) : (
              <>
                دخول لوحة التحكم
              </>
            )}
          </button>

          <div className="quickFillCard">
            <div className="quickFillInfo">
              <KeyRound size={15} />
              <span>كلمة المرور المعتمدة: A2admin2026</span>
            </div>
            <button type="button" onClick={fillDemo} className="quickFillAction">
              ملء تلقائي
            </button>
          </div>
        </form>

        <footer className="adminLoginFooterNew">
          <Link href="/" className="backToStoreLink">
            <ArrowRight size={14} /> العودة للمتجر الرئيسي
          </Link>
        </footer>
      </section>
    </main>
  );
}
