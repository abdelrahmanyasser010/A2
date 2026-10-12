"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  PackageSearch,
  Percent,
  Settings,
  Store,
  Users,
  X
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeFor = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  const isMoreActive = [
    "/admin/customers",
    "/admin/discounts",
    "/admin/reports",
    "/admin/media",
    "/admin/settings"
  ].some((h) => pathname === h || (h !== "/admin" && pathname.startsWith(h)));

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  async function logout() {
    await fetch("/api/admin/session/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="adminApp" dir="rtl">
      {/* Desktop Sidebar */}
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

      {/* Main Content Area */}
      <div className="adminMain">
        {demoMode && (
          <div className="adminDemoBanner">
            <strong>وضع المعاينة</strong>
            <span>كتالوج وطلبات تجريبية محملة لأغراض التجربة والعرض فقط.</span>
          </div>
        )}
        <header className="adminTopbar">
          <div className="adminTopbarLeft">
            <button
              type="button"
              className="adminMobileMenuBtn"
              onClick={() => setDrawerOpen(true)}
              aria-label="فتح القائمة الكاملة"
            >
              <Menu size={22} />
            </button>
            <div>
              <span className="adminMobileBrand">A²</span>
              <small>إدارة وتشغيل المتجر</small>
            </div>
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

      {/* Mobile Bottom Navigation Bar (5 tabs) */}
      <nav className="adminBottomNav" aria-label="شريط تنقل الإدارة للموبايل">
        {nav.slice(0, 4).map((item) => {
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
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`adminBottomNavMoreBtn ${isMoreActive ? "active" : ""}`}
          aria-label="المزيد من الأقسام والإعدادات"
        >
          <MoreHorizontal size={18} />
          <span>المزيد</span>
          {isMoreActive && <span className="adminMoreActiveDot" />}
        </button>
      </nav>

      {/* Mobile Admin Slide-out Drawer */}
      {drawerOpen && (
        <div
          className="adminDrawerBackdrop"
          onClick={() => setDrawerOpen(false)}
          role="presentation"
        >
          <aside
            className="adminDrawer"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            aria-label="القائمة الجانبية الكاملة للموبايل"
          >
            <div className="adminDrawerHeader">
              <div className="adminDrawerBrand">
                <span className="adminDrawerBrandLogo">A²</span>
                <div>
                  <strong>لوحة التحكم والإدارة</strong>
                  <small>مدير المتجر · صلاحية المالك</small>
                </div>
              </div>
              <button
                type="button"
                className="adminDrawerCloseBtn"
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X size={20} />
              </button>
            </div>

            <div className="adminDrawerBody">
              <div className="adminDrawerSection">
                <span className="adminDrawerSectionTitle">العمليات والكتالوج</span>
                <div className="adminDrawerNav">
                  {nav.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    const active = activeFor(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`adminDrawerLink ${active ? "active" : ""}`}
                        onClick={() => setDrawerOpen(false)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="adminDrawerSection">
                <span className="adminDrawerSectionTitle">التسويق والمبيعات والوسائط</span>
                <div className="adminDrawerNav">
                  {nav.slice(5).map((item) => {
                    const Icon = item.icon;
                    const active = activeFor(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`adminDrawerLink ${active ? "active" : ""}`}
                        onClick={() => setDrawerOpen(false)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="adminDrawerFooter">
              <Link
                href="/"
                className="adminDrawerStoreLink"
                onClick={() => setDrawerOpen(false)}
              >
                <Store size={18} />
                <span>عرض المتجر للعملاء</span>
              </Link>
              <button
                type="button"
                className="adminDrawerLogoutBtn"
                onClick={() => {
                  setDrawerOpen(false);
                  void logout();
                }}
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
