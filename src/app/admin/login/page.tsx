"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error || "Unable to sign in.");
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="adminLoginPage">
      <section className="adminLoginCard">
        <Link href="/" className="adminLoginBrand">A² <span>STORE OPS</span></Link>
        <p className="eyebrow">PRIVATE DASHBOARD</p>
        <h1>Run the drop.</h1>
        <p>Products, variants, stock, orders and promotions in one place.</p>
        <form onSubmit={submit}>
          <label>Email<input name="email" type="email" required autoComplete="username" defaultValue={process.env.NODE_ENV === "development" ? "admin@a2.local" : ""} /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          {error && <div className="adminFormError">{error}</div>}
          <button className="adminPrimary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <small>Development credentials are documented in README. Set secure environment variables before production.</small>
      </section>
    </main>
  );
}
