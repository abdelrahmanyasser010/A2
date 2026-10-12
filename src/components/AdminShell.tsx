"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Images,
  LayoutDashboard,
  LogOut,
  Percent,
  PackageSearch,
  Settings,
  Store,
  Users
} from "lucide-react";

const nav = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/orders", label: "الطلبات", icon: ClipboardList },
  { href: "/admin/products", label: "المنتجات", icon: Boxes },
  { href: "/admin/inventory", label: "المخزون", icon: PackageSearch },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/discounts", label: "العروض والكوبونات", icon: Percent },
  { href: "/admin/reports", label: "التقارير والمبيعات", icon: BarChart3 },
  { href: "/admin/media", label: "الصور والوسائط", icon: Images },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings }
];

export function AdminShell({
  children,
  demoMode = false
}: {
  children: React.ReactNode;
  demoMode?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeFor = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  async function logout() {
    await fetch("/api/admin/session/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="adminApp" dir="rtl">
      <aside className="adminSidebar">
        <Link href="/admin" className="adminBrand">
          <span>A²</span>
          <small>لوحة الإدارة</small>
        </Link>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={activeFor(item.href) ? "active" : ""}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="adminSidebarBottom">
          <Link href="/" className="storeLink">
            <Store size={18} />
            <span>عرض المتجر</span>
          </Link>
          <button className="storeLink" onClick={logout}>
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <div className="adminMain">
        {demoMode && (
          <div className="adminDemoBanner">
            <strong>وضع المعاينة</strong>
            <span>كتالوج وطلبات تجريبية محملة لأغراض التجربة والعرض فقط.</span>
          </div>
        )}
        <header className="adminTopbar">
          <div>
            <span className="adminMobileBrand">A²</span>
            <small>إدارة وتشغيل المتجر</small>
          </div>
          <div className="adminUser">
            <span>AD</span>
            <div>
              <strong>مدير المتجر</strong>
              <small>صلاحية المالك</small>
            </div>
          </div>
        </header>
        <div className="adminContent">{children}</div>
      </div>

      <nav className="adminBottomNav">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={activeFor(item.href) ? "active" : ""}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
