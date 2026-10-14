"use client";

import { FormEvent, useEffect, useState } from "react";
import { CreditCard, Plus, Power, Trash2 } from "lucide-react";

import { api, unwrapCount, unwrapList } from "@/lib/api";
import type { Doctor, MarketingSubscription } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Modal,
  PageHeader,
  PaginationBar,
  Select,
  Skeleton,
} from "@/components/ui";

const PAGE_SIZE = 10;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function plusMonthsISO(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function MarketingSubscriptionsPage() {
  const [items, setItems] = useState<MarketingSubscription[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [amount, setAmount] = useState("3000");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(plusMonthsISO(1));
  const [notes, setNotes] = useState("");

  async function load(search = q, nextPage = page) {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(nextPage),
        page_size: String(PAGE_SIZE),
      };
      if (search) params.q = search;
      const data = await api.marketingSubscriptions(params);
      const list = unwrapList(data);
      const count = unwrapCount(data);
      if (!list.length && nextPage > 1 && count > 0) {
        await load(search, nextPage - 1);
        return;
      }
      setItems(list);
      setTotal(count);
      setPage(nextPage);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("", 1);
    api
      .doctors({ page_size: "200" })
      .then((data) => setDoctors(unwrapList(data)))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeModal() {
    setOpen(false);
    setDoctorId("");
    setAmount("3000");
    setStartDate(todayISO());
    setEndDate(plusMonthsISO(1));
    setNotes("");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!doctorId) {
      setError("Select a doctor.");
      return;
    }
    setSaving(true);
    try {
      await api.createMarketingSubscription({
        doctor: Number(doctorId),
        amount,
        start_date: startDate,
        end_date: endDate,
        payment_method: "cash",
        notes,
      });
      closeModal();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive(sub: MarketingSubscription) {
    try {
      await api.updateMarketingSubscription(sub.uuid, {
        is_active: !sub.is_active,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function onDelete(sub: MarketingSubscription) {
    if (
      !window.confirm(
        `Delete marketing plan for Dr. ${sub.doctor_name} (${sub.start_date} → ${sub.end_date})?`,
      )
    ) {
      return;
    }
    try {
      await api.deleteMarketingSubscription(sub.uuid);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Marketing plans"
        subtitle="Cash enablement for WhatsApp Marketing. Doctors unlock templates and campaigns when a valid plan is active."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Enable marketing
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by doctor name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="secondary"
          onClick={() => {
            setPage(1);
            load(q, 1);
          }}
        >
          Search
        </Button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : !items.length ? (
          <div className="p-5">
            <EmptyState
              title="No marketing plans yet"
              description="Record a cash payment to enable WhatsApp Marketing for a doctor."
            />
          </div>
        ) : (
          <>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Doctor</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-slate-700/70 hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium">Dr. {s.doctor_name}</p>
                      <p className="text-xs text-slate-400">
                        {s.doctor_email || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3">Rs {s.amount}</td>
                    <td className="px-5 py-3">
                      <Badge tone="info">
                        <span className="inline-flex items-center gap-1">
                          <CreditCard size={12} />
                          Cash
                        </span>
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {s.start_date} → {s.end_date}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={
                          s.is_currently_valid
                            ? "success"
                            : s.is_active
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {s.is_currently_valid
                          ? "Valid"
                          : s.is_active
                            ? "Expired"
                            : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <IconButton
                          title={s.is_active ? "Deactivate" : "Reactivate"}
                          onClick={() => void onToggleActive(s)}
                        >
                          <Power size={15} strokeWidth={1.75} />
                        </IconButton>
                        <IconButton
                          tone="danger"
                          title="Delete plan"
                          onClick={() => void onDelete(s)}
                        >
                          <Trash2 size={15} strokeWidth={1.75} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationBar
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={(p) => load(q, p)}
            />
          </>
        )}
      </Card>

      <Modal open={open} title="Enable WhatsApp Marketing" onClose={closeModal}>
        <form onSubmit={onCreate} className="space-y-4">
          <Select
            label="Doctor"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            required
          >
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.full_name}
              </option>
            ))}
          </Select>

          <Input
            label="Amount (Rs)"
            type="number"
            min={1}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cash received for marketing enablement"
          />

          <p className="text-xs text-slate-400">Payment method is fixed to Cash.</p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Activate plan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
