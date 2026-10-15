"use client";

import { useEffect, useState } from "react";

import { api, unwrapList } from "@/lib/api";
import type { ClinicPayment, ClinicPaymentSummary, LedgerEntry } from "@/lib/types";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";

export default function ClinicLedgerPage() {
  const [payments, setPayments] = useState<ClinicPayment[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [summary, setSummary] = useState<ClinicPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.myClinicPayments({ page_size: "50" }),
      api.myClinicLedger({ page_size: "100" }),
    ])
      .then(([pays, ledger]) => {
        setPayments(unwrapList(pays));
        setEntries(unwrapList(ledger));
        setBalance(
          ledger && !Array.isArray(ledger) && "ledger_balance" in ledger
            ? (ledger.ledger_balance ?? null)
            : null,
        );
        setSummary(
          ledger && !Array.isArray(ledger) && "payment_summary" in ledger
            ? (ledger.payment_summary ?? null)
            : null,
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & ledger"
        subtitle="Read-only view of your clinic cash payments and ledger."
      />
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Status / Package</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    summary?.package_status === "active"
                      ? "success"
                      : summary?.package_status === "expired"
                        ? "danger"
                        : "warning"
                  }
                >
                  {summary?.package_status ?? "none"}
                </Badge>
                <span className="font-semibold text-white">
                  {summary?.package_name ?? "No package"}
                </span>
              </div>
              {summary?.end_date ? (
                <p className="mt-1 text-xs text-slate-400">
                  {summary.duration_days}d · Expires {summary.end_date}
                  {summary.renew_by ? ` · Renew by ${summary.renew_by}` : ""}
                </p>
              ) : null}
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Paid this month</p>
              <p className="mt-1 text-xl font-bold text-emerald-300">
                Rs {summary?.paid_this_month ?? "0.00"}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Due</p>
              <p
                className={`text-lg font-bold ${
                  Number(summary?.due ?? 0) > 0 ? "text-amber-300" : "text-slate-200"
                }`}
              >
                Rs {summary?.due ?? "0.00"}
              </p>
              <div className="mt-2">
                <Badge
                  tone={
                    summary?.payment_status === "paid"
                      ? "success"
                      : summary?.payment_status === "partial"
                        ? "warning"
                        : summary?.payment_status === "unpaid"
                          ? "danger"
                          : "neutral"
                  }
                >
                  {summary?.payment_status ?? "n/a"}
                </Badge>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Ledger balance</p>
              <p className="mt-1 text-2xl font-bold text-white">
                Rs {summary?.ledger_balance ?? balance ?? "0.00"}
              </p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-700/70 px-5 py-3 text-sm font-semibold text-white">
              Payments
            </div>
            {payments.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No payments" description="Confirmed cash payments appear here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Paid at</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.uuid} className="border-b border-slate-800/80">
                        <td className="px-5 py-3 text-emerald-300">Rs {p.amount}</td>
                        <td className="px-5 py-3 text-slate-300">{p.method}</td>
                        <td className="px-5 py-3 text-slate-400">
                          {new Date(p.paid_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone="success">{p.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-700/70 px-5 py-3 text-sm font-semibold text-white">
              Ledger
            </div>
            {entries.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No ledger rows" description="Ledger updates when payments are confirmed." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-5 py-3">When</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.uuid} className="border-b border-slate-800/80">
                        <td className="px-5 py-3 text-slate-400">
                          {new Date(e.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <Badge>{e.entry_type}</Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-200">{e.amount}</td>
                        <td className="px-5 py-3 text-slate-200">{e.balance_after}</td>
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
