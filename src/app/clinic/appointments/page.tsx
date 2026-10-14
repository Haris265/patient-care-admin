"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { DoctorTypeahead } from "@/components/DoctorTypeahead";
import { PkPhoneInput } from "@/components/PkPhoneInput";
import { api, unwrapCount, unwrapList } from "@/lib/api";
import {
  formatPkDate,
  formatPkPhone,
  isValidPkMobileNational,
  toPkMobileLocal,
} from "@/lib/pkFormat";
import type { Appointment, Doctor } from "@/lib/types";
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
const SEARCH_DEBOUNCE_MS = 300;

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ClinicAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [tokenDate, setTokenDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [patientType, setPatientType] = useState<"normal" | "discounted">("normal");
  const [jamatName, setJamatName] = useState("");
  const [editStatus, setEditStatus] = useState("upcoming");

  async function load(nextPage = page, search = q) {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(nextPage),
        page_size: String(PAGE_SIZE),
      };
      if (search.trim()) params.q = search.trim();
      if (status) params.status = status;
      if (todayOnly) params.today = "1";
      const data = await api.clinicAppointments(params);
      const list = unwrapList(data);
      const count = unwrapCount(data);
      if (!list.length && nextPage > 1 && count > 0) {
        await load(nextPage - 1, search);
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
    api
      .clinicDoctors({ page_size: "100" })
      .then((data) => setDoctors(unwrapList(data)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayOnly, status]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      load(1, q);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function resetCreateForm() {
    setPatientName("");
    setPatientPhone("");
    setDoctorId("");
    setTokenDate(todayISO());
    setNotes("");
    setPatientType("normal");
    setJamatName("");
  }

  function openCreate() {
    resetCreateForm();
    setCreateOpen(true);
  }

  function openEdit(item: Appointment) {
    setEditing(item);
    setDoctorId(String(item.doctor));
    setTokenDate(item.token_date);
    setNotes(item.notes || "");
    setPatientType(
      item.patient_type === "discounted" ? "discounted" : "normal",
    );
    setJamatName(item.jamat_name || "");
    setEditStatus(item.status);
    setEditOpen(true);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!doctorId) {
      setError("Select a doctor.");
      return;
    }
    if (!isValidPkMobileNational(patientPhone)) {
      setError("Enter a valid 10-digit Pakistani mobile (3XXXXXXXXX).");
      return;
    }
    if (patientType === "discounted" && !jamatName.trim()) {
      setError("Enter jamat / community name for discounted patients.");
      return;
    }
    setSaving(true);
    try {
      await api.createClinicAppointment({
        patient_name: patientName.trim(),
        patient_phone: toPkMobileLocal(patientPhone),
        doctor: Number(doctorId),
        token_date: tokenDate,
        notes: notes.trim() || undefined,
        patient_type: patientType,
        jamat_name:
          patientType === "discounted" ? jamatName.trim() : undefined,
      });
      setCreateOpen(false);
      resetCreateForm();
      await load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function onEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (patientType === "discounted" && !jamatName.trim()) {
      setError("Enter jamat / community name for discounted patients.");
      return;
    }
    setSaving(true);
    try {
      await api.updateClinicAppointment(editing.id, {
        status: editStatus,
        notes: notes,
        doctor: Number(doctorId),
        token_date: tokenDate,
        patient_type: patientType,
        jamat_name: patientType === "discounted" ? jamatName.trim() : "",
      });
      setEditOpen(false);
      setEditing(null);
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: Appointment) {
    if (
      !window.confirm(
        `Delete appointment ${item.token_code} for ${item.patient_name}?`,
      )
    ) {
      return;
    }
    try {
      await api.deleteClinicAppointment(item.id);
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Appointments"
        subtitle="Queue tokens booked at your clinic."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add appointment
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <Input
          placeholder="Search patient, phone, doctor"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-40"
        >
          <option value="">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Button
          variant={todayOnly ? "primary" : "secondary"}
          onClick={() => setTodayOnly((v) => !v)}
        >
          {todayOnly ? "Today" : "All dates"}
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
            <Skeleton className="h-10" />
          </div>
        ) : !items.length ? (
          <div className="p-5">
            <EmptyState
              title="No appointments"
              description="Add a booking or wait for WhatsApp tokens."
            />
          </div>
        ) : (
          <>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Token</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Doctor</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-slate-700/70 hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-sm font-bold text-sky-200">
                        {a.token_code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium text-slate-100">{a.patient_name}</p>
                        {a.patient_type === "discounted" ? (
                          <Badge tone="info">Discounted</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-400">
                        🇵🇰 {formatPkPhone(a.patient_phone)}
                      </p>
                      {a.patient_type === "discounted" && a.jamat_name ? (
                        <p className="text-xs text-slate-500">{a.jamat_name}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-slate-200">Dr. {a.doctor_name}</td>
                    <td className="px-5 py-3 text-slate-300">
                      {formatPkDate(a.token_date)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={
                          a.status === "completed"
                            ? "success"
                            : a.status === "cancelled" || a.status === "rejected"
                              ? "danger"
                              : "info"
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/clinic/appointments/${a.id}`}>
                          <IconButton tone="edit" title="View detail">
                            <Eye size={15} strokeWidth={1.75} />
                          </IconButton>
                        </Link>
                        <IconButton
                          tone="edit"
                          title="Edit"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </IconButton>
                        <IconButton
                          tone="danger"
                          title="Delete"
                          onClick={() => onDelete(a)}
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
              onPageChange={(p) => load(p)}
            />
          </>
        )}
      </Card>

      <Modal
        open={createOpen}
        title="Add appointment"
        onClose={() => setCreateOpen(false)}
      >
        <form onSubmit={onCreate} className="space-y-4">
          <Input
            label="Patient name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />
          <PkPhoneInput
            label="Patient phone"
            value={patientPhone}
            onChange={setPatientPhone}
            required
          />
          <DoctorTypeahead
            label="Doctor"
            doctors={doctors}
            value={doctorId}
            onChange={setDoctorId}
            required
            placeholder="Select or type doctor name…"
          />
          <Input
            label="Date"
            type="date"
            value={tokenDate}
            onChange={(e) => setTokenDate(e.target.value)}
            required
          />
          <Select
            label="Patient type"
            value={patientType}
            onChange={(e) =>
              setPatientType(e.target.value as "normal" | "discounted")
            }
          >
            <option value="normal">Normal</option>
            <option value="discounted">Discounted</option>
          </Select>
          {patientType === "discounted" ? (
            <Input
              label="Jamat / community"
              value={jamatName}
              onChange={(e) => setJamatName(e.target.value)}
              required
            />
          ) : null}
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="Edit appointment"
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
      >
        <form onSubmit={onEdit} className="space-y-4">
          <DoctorTypeahead
            label="Doctor"
            doctors={doctors}
            value={doctorId}
            onChange={setDoctorId}
            required
            placeholder="Select or type doctor name…"
          />
          <Input
            label="Date"
            type="date"
            value={tokenDate}
            onChange={(e) => setTokenDate(e.target.value)}
            required
          />
          <Select
            label="Patient type"
            value={patientType}
            onChange={(e) =>
              setPatientType(e.target.value as "normal" | "discounted")
            }
          >
            <option value="normal">Normal</option>
            <option value="discounted">Discounted</option>
          </Select>
          {patientType === "discounted" ? (
            <Input
              label="Jamat / community"
              value={jamatName}
              onChange={(e) => setJamatName(e.target.value)}
              required
            />
          ) : null}
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
