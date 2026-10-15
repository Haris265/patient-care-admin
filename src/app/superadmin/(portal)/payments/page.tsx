"use client";

import { useEffect, useState } from "react";

import { api, unwrapList } from "@/lib/api";
import type { ClinicPayment } from "@/lib/types";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";

export default function PaymentsPage() {
  const [items, setItems] = useState<ClinicPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .clinicPayments({ page_size: "100" })
      .then((data) => setItems(unwrapList(data)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Cash payments recorded for clinic packages." />
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-5">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No payments" description="Approved cash purchases appear here." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700/70 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Clinic</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Recorded by</th>
                  <th className="px-5 py-3">Paid at</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.uuid} className="border-b border-slate-800/80">
                    <td className="px-5 py-3 text-slate-100">{p.clinic_name}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-300">Rs {p.amount}</td>
                    <td className="px-5 py-3 text-slate-300">{p.method}</td>
                    <td className="px-5 py-3 text-slate-300">
                      {p.recorded_by_username || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(p.paid_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={p.status === "completed" ? "success" : "neutral"}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
