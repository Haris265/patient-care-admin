"use client";

import { FormEvent, useEffect, useState } from "react";

import { api, unwrapList } from "@/lib/api";
import type { ClinicBilling, ClinicPaymentSummary, LedgerEntry } from "@/lib/types";
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

export default function LedgerPage() {
  const [clinics, setClinics] = useState<ClinicBilling[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [items, setItems] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [summary, setSummary] = useState<ClinicPaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .billingClinics({ page_size: "200" })
      .then((data) => {
        const list = unwrapList(data);
        setClinics(list);
        if (list[0]) {
          setClinicId(String(list[0].id));
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load clinics"));
  }, []);

  async function loadLedger(id = clinicId) {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.ledger({ clinic: id, page_size: "100" });
      setItems(unwrapList(data));
      setBalance(
        data && !Array.isArray(data) && "ledger_balance" in data
          ? (data.ledger_balance ?? null)
          : null,
      );
      setSummary(
        data && !Array.isArray(data) && "payment_summary" in data
          ? (data.payment_summary ?? null)
          : null,
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clinicId) loadLedger(clinicId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  async function onAdjust(e: FormEvent) {
    e.preventDefault();
    if (!clinicId) return;
    setSaving(true);
    try {
      await api.ledgerAdjustment({
        clinic_id: Number(clinicId),
        amount,
        notes,
      });
      setOpen(false);
      setAmount("0");
      setNotes("");
      await loadLedger();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setSaving(false);
    }
  }

  const tone = (t: string) =>
    t === "payment_in" ? "success" : t === "package_charge" ? "warning" : "info";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger"
        subtitle="Append-only clinic ledger with running balance."
        action={
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Clinic"
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="button" onClick={() => setOpen(true)} disabled={!clinicId}>
              Adjustment
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
          <p className="mt-2">
            <Badge
              tone={
                summary?.package_status === "active"
                  ? "success"
                  : summary?.package_status === "expired"
                    ? "danger"
                    : "warning"
              }
            >
              {summary?.package_status ?? "—"}
            </Badge>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Package</p>
          <p className="mt-1 font-semibold text-white">
            {summary?.package_name ?? "None"}
          </p>
          <p className="text-xs text-slate-400">
            {summary?.duration_days != null
              ? `${summary.duration_days}d · Exp ${summary.end_date ?? "—"}`
              : "—"}
          </p>
          {summary?.renew_by ? (
            <p className="text-xs text-amber-200/80">Renew by {summary.renew_by}</p>
          ) : null}
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Paid this month</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">
            Rs {summary?.paid_this_month ?? "0.00"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Due</p>
          <p
            className={`mt-1 text-xl font-bold ${
              Number(summary?.due ?? 0) > 0 ? "text-amber-300" : "text-slate-200"
            }`}
          >
            Rs {summary?.due ?? "0.00"}
          </p>
          {summary?.package_price ? (
            <p className="text-xs text-slate-500">
              Paid {summary.amount_paid ?? "0"} / {summary.package_price}
            </p>
          ) : null}
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Pay status</p>
          <p className="mt-2">
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
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Ledger balance</p>
          <p className="mt-1 text-xl font-bold text-white">
            Rs {summary?.ledger_balance ?? balance ?? "0.00"}
          </p>
        </Card>
      </div>
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
            <EmptyState title="No ledger entries" description="Select a clinic or record a payment." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700/70 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Balance after</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.uuid} className="border-b border-slate-800/80">
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={tone(e.entry_type) as "success" | "warning" | "info"}>
                        {e.entry_type}
                      </Badge>
                    </td>
                    <td
                      className={`px-5 py-3 font-semibold ${
                        Number(e.amount) >= 0 ? "text-emerald-300" : "text-amber-300"
                      }`}
                    >
                      {Number(e.amount) >= 0 ? "+" : ""}
                      {e.amount}
                    </td>
                    <td className="px-5 py-3 text-slate-200">{e.balance_after}</td>
                    <td className="px-5 py-3 text-slate-400">{e.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} title="Ledger adjustment" onClose={() => setOpen(false)}>
        <form onSubmit={onAdjust} className="space-y-3">
          <Input
            label="Amount (+ credit / − debit)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Post adjustment"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
