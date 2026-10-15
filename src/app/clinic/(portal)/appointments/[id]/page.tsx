"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { DoctorTypeahead } from "@/components/DoctorTypeahead";
import { api, unwrapList } from "@/lib/api";
import { formatPkDate, formatPkDateTime, formatPkPhone } from "@/lib/pkFormat";
import type { Appointment, Doctor } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
} from "@/components/ui";

export default function ClinicAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const [item, setItem] = useState<Appointment | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [tokenDate, setTokenDate] = useState("");
  const [notes, setNotes] = useState("");
  const [patientType, setPatientType] = useState<"normal" | "discounted">("normal");
  const [jamatName, setJamatName] = useState("");
  const [editStatus, setEditStatus] = useState("upcoming");

  function refresh() {
    if (!id) return;
    setLoading(true);
    api
      .clinicAppointment(id)
      .then(setItem)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    api
      .clinicDoctors({ page_size: "100" })
      .then((data) => setDoctors(unwrapList(data)))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openEdit() {
    if (!item) return;
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

  async function onEdit(e: FormEvent) {
    e.preventDefault();
    if (!item) return;
    if (patientType === "discounted" && !jamatName.trim()) {
      setError("Enter jamat / community name for discounted patients.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateClinicAppointment(item.id, {
        status: editStatus,
        notes,
        doctor: Number(doctorId),
        token_date: tokenDate,
        patient_type: patientType,
        jamat_name: patientType === "discounted" ? jamatName.trim() : "",
      });
      setItem(updated);
      setEditOpen(false);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`Delete appointment ${item.token_code}?`)) return;
    try {
      await api.deleteClinicAppointment(item.id);
      router.push("/clinic/appointments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/clinic/appointments">
          <Button variant="secondary" className="px-3 py-2">
            <ArrowLeft size={16} />
            Back
          </Button>
        </Link>
        {item ? (
          <div className="flex items-center gap-1.5">
            <IconButton tone="edit" title="Edit" onClick={openEdit}>
              <Pencil size={15} strokeWidth={1.75} />
            </IconButton>
            <IconButton tone="danger" title="Delete" onClick={onDelete}>
              <Trash2 size={15} strokeWidth={1.75} />
            </IconButton>
          </div>
        ) : null}
      </div>

      <PageHeader
        title={item ? item.token_code : "Appointment detail"}
        subtitle="Full booking details for this queue token."
      />

      {error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-40" />
        </div>
      ) : item ? (
        <>
          <Card className="p-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-lg border border-accent-400/30 bg-accent-500/10 px-3 py-1.5 text-lg font-bold text-brand-200">
                {item.token_code}
              </span>
              <Badge
                tone={
                  item.status === "completed"
                    ? "success"
                    : item.status === "cancelled" || item.status === "rejected"
                      ? "danger"
                      : "info"
                }
              >
                {item.status}
              </Badge>
              {item.patient_type === "discounted" ? (
                <Badge tone="info">Discounted</Badge>
              ) : (
                <Badge tone="neutral">Normal</Badge>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Patient</p>
                <p className="mt-1 font-medium text-slate-100">{item.patient_name}</p>
                <p className="text-sm text-slate-400">
                  🇵🇰 {formatPkPhone(item.patient_phone)}
                </p>
              </div>
              {item.patient_type === "discounted" ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Jamat / community
                  </p>
                  <p className="mt-1 font-medium text-slate-100">
                    {item.jamat_name || "—"}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Doctor</p>
                <p className="mt-1 font-medium text-slate-100">Dr. {item.doctor_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Appointment date
                </p>
                <p className="mt-1 font-medium text-slate-100">
                  {formatPkDate(item.token_date)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Scheduled at</p>
                <p className="mt-1 font-medium text-slate-100">
                  {formatPkDateTime(item.scheduled_at)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Booked at</p>
                <p className="mt-1 font-medium text-slate-100">
                  {formatPkDateTime(item.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Last updated</p>
                <p className="mt-1 font-medium text-slate-100">
                  {formatPkDateTime(item.updated_at)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-2 text-sm font-semibold text-brand-200">Notes</h2>
            <p className="text-sm text-slate-300">{item.notes?.trim() || "No notes."}</p>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Link href="/clinic/appointments">
              <Button variant="secondary">All appointments</Button>
            </Link>
            <Link href="/clinic/doctors">
              <Button variant="secondary">Doctors</Button>
            </Link>
          </div>
        </>
      ) : null}

      <Modal
        open={editOpen}
        title="Edit appointment"
        onClose={() => setEditOpen(false)}
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
              onClick={() => setEditOpen(false)}
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
