"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { api, unwrapList } from "@/lib/api";
import type { BillingPackage, ClinicBilling } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Modal,
  PageHeader,
  SearchableSelect,
  Select,
  Skeleton,
} from "@/components/ui";

export default function PackagesPage() {
  const [items, setItems] = useState<BillingPackage[]>([]);
  const [clinics, setClinics] = useState<ClinicBilling[]>([]);
  const [clinicFilter, setClinicFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BillingPackage | null>(null);

  const [clinicId, setClinicId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("5000");
  const [durationDays, setDurationDays] = useState("30");
  const [maxDoctors, setMaxDoctors] = useState("5");
  const [maxPatients, setMaxPatients] = useState("500");
  const [isActive, setIsActive] = useState("true");

  async function load(filter = clinicFilter) {
    setLoading(true);
    try {
      const params: Record<string, string> = { page_size: "100" };
      if (filter) params.clinic = filter;
      const [pkgs, clinicList] = await Promise.all([
        api.packages(params),
        api.billingClinics({ page_size: "200" }),
      ]);
      setItems(unwrapList(pkgs));
      setClinics(unwrapList(clinicList));
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

  const clinicOptions = useMemo(
    () => clinics.filter((c) => c.is_active !== false),
    [clinics],
  );

  const clinicSelectOptions = useMemo(
    () =>
      clinicOptions.map((c) => ({
        value: String(c.id),
        label: c.name,
        sublabel: [c.city, c.area].filter(Boolean).join(", "),
      })),
    [clinicOptions],
  );

  function resetForm() {
    setEditing(null);
    setClinicId(clinicOptions[0] ? String(clinicOptions[0].id) : "");
    setName("");
    setCode("");
    setDescription("");
    setPrice("5000");
    setDurationDays("30");
    setMaxDoctors("5");
    setMaxPatients("500");
    setIsActive("true");
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(pkg: BillingPackage) {
    setEditing(pkg);
    setClinicId(pkg.clinic != null ? String(pkg.clinic) : "");
    setName(pkg.name);
    setCode(pkg.code);
    setDescription(pkg.description);
    setPrice(pkg.price);
    setDurationDays(String(pkg.duration_days));
    setMaxDoctors(String(pkg.max_doctors));
    setMaxPatients(String(pkg.max_patients));
    setIsActive(pkg.is_active ? "true" : "false");
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clinicId) {
      setError("Select a clinic for this package.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        code,
        description,
        price,
        duration_days: Number(durationDays),
        max_doctors: Number(maxDoctors),
        max_patients: Number(maxPatients),
        is_active: isActive === "true",
        clinic_id: Number(clinicId),
      };
      if (editing) {
        await api.updatePackage(editing.uuid, payload);
      } else {
        await api.createPackage(payload);
      }
      setOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(pkg: BillingPackage) {
    if (!window.confirm(`Delete package "${pkg.name}"?`)) return;
    try {
      await api.deletePackage(pkg.uuid);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packages"
        subtitle="Clinic-scoped subscription packages."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchableSelect
              className="min-w-[14rem]"
              value={clinicFilter}
              onChange={(next) => {
                setClinicFilter(next);
                load(next);
              }}
              options={clinicSelectOptions}
              placeholder="Search clinics…"
              allowEmpty
              emptyLabel="All clinics"
            />
            <Button type="button" onClick={openCreate}>
              <Plus size={16} /> New package
            </Button>
          </div>
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
            <EmptyState title="No packages" description="Create a package for a clinic." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700/70 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Clinic</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Limits</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((pkg) => (
                  <tr key={pkg.uuid} className="border-b border-slate-800/80">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-100">{pkg.name}</div>
                      <div className="text-xs text-slate-400">{pkg.code}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{pkg.clinic_name || "—"}</td>
                    <td className="px-5 py-3 text-slate-200">Rs {pkg.price}</td>
                    <td className="px-5 py-3 text-slate-300">{pkg.duration_days} days</td>
                    <td className="px-5 py-3 text-slate-300">
                      {pkg.max_doctors} docs · {pkg.max_patients} pts
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={pkg.is_active ? "success" : "neutral"}>
                        {pkg.is_active ? "Active" : "Off"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <IconButton title="Edit" tone="edit" onClick={() => openEdit(pkg)}>
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton title="Delete" tone="danger" onClick={() => onDelete(pkg)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        title={editing ? "Edit package" : "New package"}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <SearchableSelect
            label="Clinic"
            value={clinicId}
            onChange={setClinicId}
            options={clinicSelectOptions}
            placeholder="Search clinic…"
            required
          />
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={!!editing}
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input
              label="Duration (days)"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              required
            />
            <Input
              label="Max doctors"
              value={maxDoctors}
              onChange={(e) => setMaxDoctors(e.target.value)}
            />
            <Input
              label="Max patients"
              value={maxPatients}
              onChange={(e) => setMaxPatients(e.target.value)}
            />
          </div>
          <Select label="Active" value={isActive} onChange={(e) => setIsActive(e.target.value)}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : editing ? "Update" : "Create"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
