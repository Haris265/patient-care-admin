"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  BookOpen,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  ShoppingCart,
  X,
} from "lucide-react";

import { clearAuth, getStoredUser } from "@/lib/api";
import type { UserInfo } from "@/lib/types";

const NAV = [
  { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/packages", label: "Packages", icon: Package },
  { href: "/superadmin/clinics", label: "Clinics", icon: Building2 },
  { href: "/superadmin/requests", label: "Requests", icon: ShoppingCart },
  { href: "/superadmin/payments", label: "Payments", icon: CreditCard },
  { href: "/superadmin/ledger", label: "Ledger", icon: ScrollText },
];

export function SuperadminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "superadmin") {
      clearAuth();
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0a1220 0%, #152744 100%)" }}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  const Sidebar = (
    <aside
      className="premium-card relative m-3 flex h-[calc(100vh-1.5rem)] w-64 flex-col overflow-hidden rounded-3xl text-slate-200"
      style={{
        background: "linear-gradient(165deg, rgba(15,28,46,0.98) 0%, rgba(10,18,32,0.99) 70%)",
        boxShadow: "var(--shadow-showroom)",
      }}
    >
      <div className="relative z-10 flex items-center justify-between px-5 py-6">
        <div>
          <div className="text-xl font-bold tracking-tight text-white">PatientCare</div>
          <div className="mt-1 text-xs uppercase tracking-[0.22em] text-amber-300/80">
            Superadmin
          </div>
        </div>
        {open ? (
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 lg:hidden">
            <X size={20} />
          </button>
        ) : null}
      </div>

      <nav className="relative z-10 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/superadmin/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`shine-hover group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active
                  ? "translate-x-0.5 border border-amber-300/25 bg-gradient-to-b from-amber-500 to-amber-700 text-white"
                  : "text-slate-300/80 hover:translate-x-0.5 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="premium-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-white/10 bg-white/5 text-inherit">
                <Icon size={17} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative z-10 m-3 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
          <div className="font-semibold text-white">{user.full_name}</div>
          <div className="mt-1 truncate text-slate-400">{user.email || user.username}</div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="premium-page-bg min-h-screen lg:flex">
      <div className="mesh-grid-bg pointer-events-none fixed inset-0" />
      <div className="relative z-10 hidden lg:block">{Sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[280px]">{Sidebar}</div>
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="premium-card m-3 mb-0 flex items-center justify-between rounded-3xl px-4 py-3 sm:px-5">
          <button
            className="rounded-xl border border-slate-600/70 px-3 py-2 text-sm text-slate-200 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-slate-100">Platform billing</p>
            <p className="text-xs text-slate-400">Packages · Clinics · Ledger</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
            <BookOpen size={12} />
            Superadmin
          </div>
        </header>
        <main className="flex-1 px-3 py-4 sm:px-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
