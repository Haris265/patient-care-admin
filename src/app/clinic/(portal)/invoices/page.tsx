"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

import { api, unwrapList } from "@/lib/api";
import type { BillingInvoice } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Skeleton,
} from "@/components/ui";

function statusTone(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "cancelled") return "neutral" as const;
  if (status === "pending_verification") return "warning" as const;
  if (status === "overdue") return "danger" as const;
  return "warning" as const;
}

export default function ClinicInvoicesPage() {
  const [items, setItems] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selected, setSelected] = useState<BillingInvoice | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.clinicInvoices({ page_size: "100" });
      setItems(unwrapList(data));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openSubmit(inv: BillingInvoice) {
    setSelected(inv);
    setNotes("");
    setSubmitOpen(true);
  }

  async function onSubmitPayment() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.submitInvoicePayment(selected.uuid, { notes });
      setSubmitOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = (s: string) => s === "pending" || s === "overdue";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Pay pending invoices. Superadmin confirms payment to unlock your clinic."
      />
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
            <EmptyState title="No invoices" description="Invoices appear after you accept a package offer." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700/70 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((inv) => (
                  <tr key={inv.uuid} className="border-b border-slate-800/80">
                    <td className="px-5 py-3 text-slate-100">{inv.package_name}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {inv.period_start} → {inv.period_end}
                      <div>Due {inv.due_date}</div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-300">Rs {inv.amount}</td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canSubmit(inv.status) ? (
                        <Button type="button" onClick={() => openSubmit(inv)}>
                          <Send size={14} /> Submit payment
                        </Button>
                      ) : inv.status === "pending_verification" ? (
                        <span className="text-xs text-amber-200/80">Awaiting confirmation</span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={submitOpen} title="Submit payment" onClose={() => setSubmitOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Mark Rs {selected?.amount} as paid for {selected?.package_name}. Superadmin will
            verify and unlock your clinic.
          </p>
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button type="button" disabled={saving} className="w-full" onClick={onSubmitPayment}>
            {saving ? "Submitting…" : "I have paid"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
