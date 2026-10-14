"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { api, unwrapList } from "@/lib/api";
import type { PurchaseRequest } from "@/lib/types";
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

export default function RequestsPage() {
  const [items, setItems] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("pending");
  const [approveOpen, setApproveOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(nextStatus = status) {
    setLoading(true);
    try {
      const params: Record<string, string> = { page_size: "100" };
      if (nextStatus) params.status = nextStatus;
      const data = await api.purchaseRequests(params);
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

  function openApprove(req: PurchaseRequest) {
    setSelected(req);
    setAmount(req.package_price);
    setNotes("");
    setApproveOpen(true);
  }

  async function onApprove() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.approvePurchaseRequest(selected.uuid, {
        amount,
        notes,
      });
      setApproveOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setSaving(false);
    }
  }

  async function onReject(req: PurchaseRequest) {
    if (!window.confirm(`Reject request from ${req.clinic_name}?`)) return;
    try {
      await api.rejectPurchaseRequest(req.uuid, { notes: "Rejected by superadmin" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    }
  }

  const tone = (s: string) =>
    s === "approved" ? "success" : s === "rejected" ? "danger" : "warning";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase requests"
        subtitle="Approve cash payments to activate clinic packages."
        action={
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              load(e.target.value);
            }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
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
            <EmptyState title="No requests" description="Clinic purchase requests will appear here." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700/70 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Clinic</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Requested by</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.uuid} className="border-b border-slate-800/80">
                    <td className="px-5 py-3 text-slate-100">{r.clinic_name}</td>
                    <td className="px-5 py-3">
                      <div className="text-slate-200">{r.package_name}</div>
                      <div className="text-xs text-slate-400">Rs {r.package_price}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {r.requested_by_username || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={tone(r.status) as "success" | "danger" | "warning"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {r.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button type="button" onClick={() => openApprove(r)}>
                            <Check size={14} /> Approve cash
                          </Button>
                          <Button type="button" variant="danger" onClick={() => onReject(r)}>
                            <X size={14} /> Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-slate-500">—</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={approveOpen} title="Confirm cash payment" onClose={() => setApproveOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            {selected?.clinic_name} → {selected?.package_name}
          </p>
          <Input label="Cash amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button type="button" disabled={saving} className="w-full" onClick={onApprove}>
            {saving ? "Confirming…" : "Confirm & activate"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
