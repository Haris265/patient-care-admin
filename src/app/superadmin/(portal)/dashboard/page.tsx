"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, CreditCard, Package, ShoppingCart } from "lucide-react";

import { api } from "@/lib/api";
import type { SuperadminDashboard } from "@/lib/types";
import { Badge, Card, PageHeader, Skeleton } from "@/components/ui";

export default function SuperadminDashboardPage() {
  const [data, setData] = useState<SuperadminDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .superDashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Active clinic subs",
      value: data?.active_subscriptions ?? 0,
      icon: Package,
      href: "/superadmin/clinics",
    },
    {
      label: "Pending requests",
      value: data?.pending_requests ?? 0,
      icon: ShoppingCart,
      href: "/superadmin/requests",
    },
    {
      label: "Active packages",
      value: data?.total_packages ?? 0,
      icon: Building2,
      href: "/superadmin/packages",
    },
    {
      label: "Cash this month",
      value: data ? `Rs ${data.cash_collected_month}` : "—",
      icon: CreditCard,
      href: "/superadmin/payments",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Superadmin dashboard" subtitle="Clinic packages, cash payments, and ledger." />
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)
          : stats.map(({ label, value, icon: Icon, href }, i) => (
              <Link
                key={label}
                href={href}
                className={`premium-card premium-hover-lift animate-fade-in-up stagger-${Math.min(i + 1, 4)} block rounded-3xl p-5 no-underline`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                  </div>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{
                      background:
                        "linear-gradient(145deg, #3d9a82 0%, #145D4F 55%, #0b322b 100%)",
                    }}
                  >
                    <Icon size={18} />
                  </span>
                </div>
              </Link>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Pending requests</h3>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : data?.pending_request_list?.length ? (
            <ul className="space-y-2">
              {data.pending_request_list.map((r) => (
                <li
                  key={r.uuid}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-100">{r.clinic_name}</div>
                    <div className="text-xs text-slate-400">{r.package_name}</div>
                  </div>
                  <Badge>{r.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No pending requests.</p>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Recent payments</h3>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : data?.recent_payments?.length ? (
            <ul className="space-y-2">
              {data.recent_payments.map((p) => (
                <li
                  key={p.uuid}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-100">{p.clinic_name}</div>
                    <div className="text-xs text-slate-400">{p.method}</div>
                  </div>
                  <span className="font-semibold text-emerald-300">Rs {p.amount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No payments yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
