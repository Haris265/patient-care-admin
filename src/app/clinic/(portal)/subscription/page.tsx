"use client";

import { useEffect, useState } from "react";

import { api, unwrapList } from "@/lib/api";
import type { ClinicBilling, ClinicSubscription } from "@/lib/types";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";

export default function ClinicSubscriptionPage() {
  const [me, setMe] = useState<ClinicBilling | null>(null);
  const [items, setItems] = useState<ClinicSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.clinicMe(), api.myClinicSubscriptions({ page_size: "50" })])
      .then(([clinic, subs]) => {
        setMe(clinic);
        setItems(unwrapList(subs));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="My subscription" subtitle="Active and past clinic package subscriptions." />
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">Clinic</p>
            <p className="mt-1 text-xl font-bold text-white">{me?.name}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Badge
                tone={
                  me?.payment_summary?.package_status === "active"
                    ? "success"
                    : me?.payment_summary?.package_status === "expired"
                      ? "danger"
                      : "warning"
                }
              >
                {me?.payment_summary?.package_status ??
                  (me?.has_active_package ? "active" : "none")}
              </Badge>
              <Badge
                tone={
                  me?.payment_summary?.payment_status === "paid"
                    ? "success"
                    : me?.payment_summary?.payment_status === "partial"
                      ? "warning"
                      : me?.payment_summary?.payment_status === "unpaid"
                        ? "danger"
                        : "neutral"
                }
              >
                pay: {me?.payment_summary?.payment_status ?? "n/a"}
              </Badge>
              <span className="text-slate-300">
                Balance: Rs{" "}
                {me?.payment_summary?.ledger_balance ?? me?.ledger_balance ?? "0.00"}
              </span>
            </div>
            {me?.payment_summary?.package_name ? (
              <div className="mt-4 grid gap-2 rounded-xl border border-slate-700/60 bg-slate-900/40 p-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Package</p>
                  <p className="font-medium text-slate-100">
                    {me.payment_summary.package_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {me.payment_summary.duration_days} days
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Expires / Renew</p>
                  <p className="text-slate-200">{me.payment_summary.end_date ?? "—"}</p>
                  {me.payment_summary.renew_by ? (
                    <p className="text-xs text-amber-200/90">
                      Renew by {me.payment_summary.renew_by}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Paid month / Due
                  </p>
                  <p className="text-emerald-300">
                    Rs {me.payment_summary.paid_this_month}
                  </p>
                  <p
                    className={
                      Number(me.payment_summary.due) > 0
                        ? "text-amber-300"
                        : "text-slate-300"
                    }
                  >
                    Due Rs {me.payment_summary.due}
                  </p>
                </div>
              </div>
            ) : null}
          </Card>
          <Card className="overflow-hidden">
            {items.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No subscriptions"
                  description="Request a package from the Packages page."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-700/70 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Package</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3">Period</th>
                      <th className="px-5 py-3">Paid</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => (
                      <tr key={s.uuid} className="border-b border-slate-800/80">
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-100">{s.package_name}</div>
                          <div className="text-xs text-slate-400">{s.package_code}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {s.duration_days != null ? `${s.duration_days} days` : "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {s.start_date} → {s.end_date}
                          {s.is_currently_valid ? (
                            <div className="mt-0.5 text-xs text-amber-200/80">
                              Renew by {s.end_date}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-5 py-3 text-emerald-300">Rs {s.amount_paid}</td>
                        <td className="px-5 py-3">
                          <Badge
                            tone={
                              s.is_currently_valid
                                ? "success"
                                : s.status === "cancelled"
                                  ? "danger"
                                  : "neutral"
                            }
                          >
                            {s.is_currently_valid ? "valid" : s.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
