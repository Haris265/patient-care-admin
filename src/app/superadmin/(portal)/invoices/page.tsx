"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

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
  Select,
  Skeleton,
} from "@/components/ui";

function statusTone(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "cancelled") return "neutral" as const;
  if (status === "pending_verification") return "warning" as const;
  if (status === "overdue") return "danger" as const;
  return "warning" as const;
}

export default function SuperadminInvoicesPage() {
  const [items, setItems] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [markOpen, setMarkOpen] = useState(false);
  const [selected, setSelected] = useState<BillingInvoice | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(nextStatus = status) {
    setLoading(true);
    try {
      const params: Record<string, string> = { page_size: "100" };
      if (nextStatus) params.status = nextStatus;
      const data = await api.superadminInvoices(params);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openMarkPaid(inv: BillingInvoice) {
    setSelected(inv);
    setNotes("");
    setMarkOpen(true);
  }

  async function onMarkPaid() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.markInvoicePaid(selected.uuid, { notes });
      setMarkOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mark paid failed");
    } finally {
      setSaving(false);
    }
  }

  const canMarkPaid = (s: string) =>
    s === "pending" || s === "pending_verification" || s === "overdue";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Confirm clinic invoice payments to activate packages."
        action={
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              load(e.target.value);
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="pending_verification">Pending verification</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        }
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
            <EmptyState title="No invoices" description="Invoices appear after clinics accept offers or renewals are approved." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700/70 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Clinic</th>
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
                    <td className="px-5 py-3 text-slate-100">{inv.clinic_name}</td>
                    <td className="px-5 py-3 text-slate-200">{inv.package_name}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {inv.period_start} → {inv.period_end}
                      <div>Due {inv.due_date}</div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-300">Rs {inv.amount}</td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canMarkPaid(inv.status) ? (
                        <Button type="button" onClick={() => openMarkPaid(inv)}>
                          <Check size={14} /> Mark paid
                        </Button>
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

      <Modal open={markOpen} title="Mark invoice paid" onClose={() => setMarkOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            {selected?.clinic_name} → {selected?.package_name} (Rs {selected?.amount})
          </p>
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button type="button" disabled={saving} className="w-full" onClick={onMarkPaid}>
            {saving ? "Confirming…" : "Confirm paid & activate"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
