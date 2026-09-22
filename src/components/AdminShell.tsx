"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Boxes, ClipboardList, Images, LayoutDashboard, LogOut, Percent, PackageSearch, Settings, Store, Users } from "lucide-react";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
  { href: "/admin/discounts", label: "Discounts", icon: Percent },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminShell({ children, demoMode = false }: { children: React.ReactNode; demoMode?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeFor = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(href));

  async function logout() {
    await fetch("/api/admin/session/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="adminApp">
      <aside className="adminSidebar">
        <Link href="/admin" className="adminBrand"><span>A²</span><small>ADMIN</small></Link>
        <nav>{nav.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className={activeFor(item.href) ? "active" : ""}><Icon size={18} /><span>{item.label}</span></Link>; })}</nav>
        <div className="adminSidebarBottom">
          <Link href="/" className="storeLink"><Store size={18} />View store</Link>
          <button className="storeLink" onClick={logout}><LogOut size={18} />Sign out</button>
        </div>
      </aside>
      <div className="adminMain">
        {demoMode && <div className="adminDemoBanner"><strong>DEMO DATA</strong><span>Temporary catalogue, orders and customer records are loaded for development only.</span></div>}
        <header className="adminTopbar"><div><span className="adminMobileBrand">A²</span><small>Store operations</small></div><div className="adminUser"><span>AD</span><div><strong>Admin</strong><small>Owner access</small></div></div></header>
        <div className="adminContent">{children}</div>
      </div>
      <nav className="adminBottomNav">{nav.slice(0,5).map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className={activeFor(item.href) ? "active" : ""}><Icon size={18} /><span>{item.label}</span></Link>; })}</nav>
    </div>
  );
}
