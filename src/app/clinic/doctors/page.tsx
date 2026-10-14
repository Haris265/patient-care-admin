"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil, Plus, Trash2, Upload } from "lucide-react";

import { api, getToken, unwrapCount, unwrapList } from "@/lib/api";
import type { Doctor, Speciality } from "@/lib/types";
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
  Skeleton,
} from "@/components/ui";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function ClinicDoctorsPage() {
  const [items, setItems] = useState<Doctor[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionTime, setSessionTime] = useState(15);
  const [consultationFee, setConsultationFee] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);

  async function load(search = q, nextPage = page) {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(nextPage),
        page_size: String(PAGE_SIZE),
      };
      if (search) params.q = search;
      const data = await api.clinicDoctors(params);
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
      .clinicSpecialities({ page_size: "100" })
      .then((data) => setSpecialities(unwrapList(data).filter((s) => s.is_active)))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      load(q, 1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setSessionTime(15);
    setConsultationFee("");
    setSelectedSpecs([]);
    setIsActive(true);
  }

  function toggleSpec(id: number) {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function openCreate() {
    resetForm();
    setCreateOpen(true);
  }

  function openEdit(d: Doctor) {
    setEditing(d);
    setFirstName(d.first_name);
    setLastName(d.last_name);
    setEmail(d.email);
    setPassword("");
    setSessionTime(d.session_time);
    setConsultationFee(d.consultation_fee || "");
    setSelectedSpecs(d.specialities.map((s) => s.id));
    setIsActive(d.is_active);
    setEditOpen(true);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!selectedSpecs.length) {
      setError("Select at least one speciality.");
      return;
    }
    setSaving(true);
    try {
      await api.createClinicDoctor({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        speciality_ids: selectedSpecs,
        session_time: sessionTime,
        consultation_fee: consultationFee || undefined,
      });
      setCreateOpen(false);
      resetForm();
      setInfo("Doctor added to your clinic.");
      await load(q, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function onEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!selectedSpecs.length) {
      setError("Select at least one speciality.");
      return;
    }
    setSaving(true);
    try {
      await api.patchClinicDoctor(editing.uuid, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        speciality_ids: selectedSpecs,
        session_time: sessionTime,
        consultation_fee: consultationFee || undefined,
        is_active: isActive,
      });
      setEditOpen(false);
      setEditing(null);
      setInfo("Doctor updated.");
      await load(q, page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(d: Doctor) {
    if (
      !window.confirm(
        `Remove Dr. ${d.full_name} from this clinic? Their account will remain.`,
      )
    ) {
      return;
    }
    try {
      await api.deleteClinicDoctor(d.uuid);
      setInfo("Doctor removed from clinic.");
      await load(q, page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  }

  async function onImportFile(file: File | null) {
    if (!file) return;
    setImporting(true);
    setError("");
    setInfo("");
    try {
      const result = await api.importClinicDoctors(file);
      const failN = result.failed?.length || 0;
      setInfo(
        `Import done: ${result.created} created` +
          (failN ? `, ${failN} failed` : "") +
          `.`,
      );
      if (failN) {
        setError(
          result.failed
            .slice(0, 5)
            .map((f) => `Row ${f.row}: ${f.error}`)
            .join(" · "),
        );
      }
      await load(q, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const token = getToken();
    const url = api.clinicDoctorImportTemplateUrl();
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to download template");
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "clinic_doctors_import_template.xlsx";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Download failed"));
  }

  const specialityPicker = (
    <div>
      <p className="mb-2 text-sm font-medium text-sky-200">Specialities</p>
      <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
        {specialities.map((s) => {
          const active = selectedSpecs.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSpec(s.id)}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "border-sky-400/50 bg-sky-500/15 text-sky-100"
                  : "border-slate-600 hover:border-sky-400/40"
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Doctors"
        subtitle="Add, edit, or import clinicians for your clinic."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={downloadTemplate}>
              <Download size={16} />
              Template
            </Button>
            <Button
              variant="secondary"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} />
              {importing ? "Importing…" : "Import Excel"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xlsm,.csv"
              className="hidden"
              onChange={(e) => onImportFile(e.target.files?.[0] || null)}
            />
            <Button onClick={openCreate}>
              <Plus size={16} />
              Add doctor
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {info}
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
              title="No doctors linked"
              description="Add a doctor or import an Excel file to get started."
            />
          </div>
        ) : (
          <>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Doctor</th>
                  <th className="px-5 py-3 font-medium">Specialities</th>
                  <th className="px-5 py-3 font-medium">Session</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-slate-700/70 hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium">Dr. {d.full_name}</p>
                      <p className="text-xs text-slate-400">{d.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {d.specialities.map((s) => (
                          <Badge key={s.id} tone="info">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">{d.session_time} min</td>
                    <td className="px-5 py-3">
                      <Badge tone={d.is_active ? "success" : "neutral"}>
                        {d.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/clinic/doctors/${d.uuid}`}>
                          <IconButton tone="edit" title="View detail">
                            <Eye size={15} strokeWidth={1.75} />
                          </IconButton>
                        </Link>
                        <IconButton
                          tone="edit"
                          title="Edit"
                          onClick={() => openEdit(d)}
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </IconButton>
                        <IconButton
                          tone="danger"
                          title="Remove from clinic"
                          onClick={() => onDelete(d)}
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

      <Modal
        open={createOpen}
        title="Add doctor"
        onClose={() => setCreateOpen(false)}
        className="max-w-xl"
      >
        <form onSubmit={onCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          {specialityPicker}
          <Input
            label="Session time (minutes)"
            type="number"
            min={5}
            max={240}
            value={sessionTime}
            onChange={(e) => setSessionTime(Number(e.target.value))}
            required
          />
          <Input
            label="Consultation fee (optional)"
            type="number"
            min={0}
            step="0.01"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
          />
          <Input
            label="Login email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Temporary password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
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
        title="Edit doctor"
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        className="max-w-xl"
      >
        <form onSubmit={onEdit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-slate-400">Login email: {email}</p>
          {specialityPicker}
          <Input
            label="Session time (minutes)"
            type="number"
            min={5}
            max={240}
            value={sessionTime}
            onChange={(e) => setSessionTime(Number(e.target.value))}
            required
          />
          <Input
            label="Consultation fee"
            type="number"
            min={0}
            step="0.01"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
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
