"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Stethoscope,
  X,
} from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { api, clearAuth, getStoredUser } from "@/lib/api";
import type { ClinicBilling, UserInfo } from "@/lib/types";

const ALL_NAV = [
  { href: "/clinic/dashboard", label: "Dashboard", icon: LayoutDashboard, always: true },
  { href: "/clinic/invoices", label: "Invoices", icon: FileText, always: true },
  { href: "/clinic/packages", label: "Packages", icon: Package, always: true },
  { href: "/clinic/doctors", label: "Doctors", icon: Stethoscope, always: false },
  { href: "/clinic/appointments", label: "Appointments", icon: CalendarDays, always: false },
  { href: "/clinic/subscription", label: "Subscription", icon: CreditCard, always: true },
  { href: "/clinic/ledger", label: "Payments & Ledger", icon: ScrollText, always: true },
];

const LOCKED_ALLOWED = new Set([
  "/clinic/dashboard",
  "/clinic/invoices",
  "/clinic/packages",
  "/clinic/subscription",
  "/clinic/ledger",
]);

export function ClinicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [me, setMe] = useState<ClinicBilling | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "clinic_admin") {
      clearAuth();
      router.replace("/clinic/login");
      return;
    }
    setUser(u);
    api
      .clinicMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, [router]);

  const locked = Boolean(me?.access_locked);

  const nav = useMemo(
    () => ALL_NAV.filter((item) => !locked || item.always),
    [locked],
  );

  useEffect(() => {
    if (!me || !locked) return;
    const allowed = [...LOCKED_ALLOWED].some(
      (href) => pathname === href || pathname.startsWith(`${href}/`),
    );
    if (!allowed) {
      router.replace("/clinic/dashboard");
    }
  }, [me, locked, pathname, router]);

  function logout() {
    clearAuth();
    router.replace("/clinic/login");
  }

  if (!user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--loading-bg)" }}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" />
      </div>
    );
  }

  const Sidebar = (
    <aside
      className="premium-card relative m-3 flex h-[calc(100vh-1.5rem)] w-64 flex-col overflow-hidden rounded-3xl text-slate-200"
      style={{
        background: "var(--sidebar-bg)",
        boxShadow: "var(--shadow-showroom)",
      }}
    >
      <div className="relative z-10 flex items-center justify-between px-5 py-6">
        <div>
          <BrandLogo priority />
          <div className="mt-2 text-xs uppercase tracking-[0.22em] text-brand-300/80">
            Clinic Portal
          </div>
        </div>
        {open ? (
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 lg:hidden">
            <X size={20} />
          </button>
        ) : null}
      </div>

      <nav className="relative z-10 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`shine-hover group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active
                  ? "translate-x-0.5 border border-accent-400/25 text-white depth-glow"
                  : "text-slate-300/80 hover:translate-x-0.5 hover:bg-white/8 hover:text-white"
              }`}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(145deg, #3d9a82 0%, #145D4F 55%, #0b322b 100%)",
                    }
                  : undefined
              }
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
        {locked ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
            Features locked — accept offer and pay invoice to unlock.
          </div>
        ) : null}
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
            <p className="text-sm font-semibold text-slate-100">Clinic portal</p>
            <p className="text-xs text-slate-400">
              {locked
                ? "Locked — Dashboard · Invoices · Packages"
                : "Doctors · Appointments · Packages · Ledger"}
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{
              background: locked
                ? "linear-gradient(145deg, #c4a35a 0%, #8a6a2a 55%, #4a3810 100%)"
                : "linear-gradient(145deg, #3d9a82 0%, #145D4F 55%, #0b322b 100%)",
            }}
          >
            <CreditCard size={12} />
            {locked ? "Locked" : "Clinic"}
          </div>
        </header>
        <main className="flex-1 px-3 py-4 sm:px-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
