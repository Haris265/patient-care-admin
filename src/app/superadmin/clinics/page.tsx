"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, UserPlus } from "lucide-react";

import { api, unwrapList } from "@/lib/api";
import type { BillingPackage, ClinicBilling } from "@/lib/types";
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

function packageStatusTone(status?: string) {
  if (status === "active") return "success" as const;
  if (status === "expired") return "danger" as const;
  return "warning" as const;
}

function paymentStatusTone(status?: string) {
  if (status === "paid") return "success" as const;
  if (status === "partial") return "warning" as const;
  if (status === "unpaid") return "danger" as const;
  return "neutral" as const;
}

export default function SuperadminClinicsPage() {
  const [items, setItems] = useState<ClinicBilling[]>([]);
  const [packages, setPackages] = useState<BillingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicBilling | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [packageId, setPackageId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [clinics, pkgs] = await Promise.all([
        api.billingClinics({ page_size: "200" }),
        api.packages({ page_size: "100", is_active: "true" }),
      ]);
      setItems(unwrapList(clinics));
      setPackages(unwrapList(pkgs));
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

  function openAdmin(clinic: ClinicBilling) {
    setSelectedClinic(clinic);
    setUsername("");
    setPassword("");
    setEmail("");
    setAdminOpen(true);
  }

  function openAssign(clinic: ClinicBilling) {
    setSelectedClinic(clinic);
    setPackageId(packages[0] ? String(packages[0].id) : "");
    setAmount(packages[0]?.price || "");
    setNotes("");
    setAssignOpen(true);
  }

  async function onCreateAdmin(e: FormEvent) {
    e.preventDefault();
    if (!selectedClinic) return;
    setSaving(true);
    try {
      await api.createClinicAdmin({
        clinic_id: selectedClinic.id,
        username,
        password,
        email,
      });
      setAdminOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create clinic admin");
    } finally {
      setSaving(false);
    }
  }

  async function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!selectedClinic || !packageId) return;
    setSaving(true);
    try {
      await api.assignPackage({
        clinic_id: selectedClinic.id,
        package_id: Number(packageId),
        amount: amount || undefined,
        notes,
      });
      setAssignOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinics"
        subtitle="Attach clinic admins and assign packages after cash payment."
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
            <EmptyState
              title="No clinics"
              description="Create clinics from the hospital admin portal first."
            />
          </div>
        ) : (
          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-700/70 bg-slate-900/95 text-xs uppercase text-slate-400 backdrop-blur">
                <tr>
                  <th className="w-[18%] px-3 py-3">Clinic</th>
                  <th className="w-[10%] px-3 py-3">Admin</th>
                  <th className="w-[22%] px-3 py-3">Package</th>
                  <th className="w-[20%] px-3 py-3">Payments</th>
                  <th className="w-[12%] px-3 py-3">Balance</th>
                  <th className="w-[18%] px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const s = c.payment_summary;
                  const pkgStatus =
                    s?.package_status ?? (c.has_active_package ? "active" : "none");
                  const due = Number(s?.due ?? 0);
                  return (
                    <tr key={c.id} className="border-b border-slate-800/80">
                      <td className="px-3 py-3 align-top">
                        <div className="truncate font-medium text-slate-100" title={c.name}>
                          {c.name}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {c.city || c.area || c.address}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-slate-300">
                        <span className="truncate block" title={c.clinic_admin_username || ""}>
                          {c.clinic_admin_username || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={packageStatusTone(pkgStatus)}>{pkgStatus}</Badge>
                          {s?.package_name ? (
                            <span className="font-medium text-slate-100">{s.package_name}</span>
                          ) : null}
                        </div>
                        {s?.package_name ? (
                          <div className="mt-1 space-y-0.5 text-xs text-slate-400">
                            <div>
                              {s.duration_days != null ? `${s.duration_days} days` : "—"}
                            </div>
                            {s.end_date ? <div>Expires {s.end_date}</div> : null}
                            {s.renew_by ? (
                              <div className="text-amber-200/80">Renew by {s.renew_by}</div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="mt-1 block text-xs text-slate-500">No package</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="space-y-1 text-xs">
                          <div className="text-emerald-300">
                            Paid (mo): Rs {s?.paid_this_month ?? "0.00"}
                          </div>
                          <div className={due > 0 ? "text-amber-300" : "text-slate-300"}>
                            Due: Rs {s?.due ?? "0.00"}
                          </div>
                          <Badge tone={paymentStatusTone(s?.payment_status)}>
                            {s?.payment_status ?? "n/a"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-slate-200">
                        Rs {s?.ledger_balance ?? c.ledger_balance ?? "0.00"}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => openAdmin(c)}
                          >
                            <UserPlus size={14} /> Admin
                          </Button>
                          <Button type="button" onClick={() => openAssign(c)}>
                            <Plus size={14} /> Assign
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={adminOpen} title="Create clinic admin" onClose={() => setAdminOpen(false)}>
        <form onSubmit={onCreateAdmin} className="space-y-3">
          <p className="text-sm text-slate-400">Clinic: {selectedClinic?.name}</p>
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Creating…" : "Create admin"}
          </Button>
        </form>
      </Modal>

      <Modal open={assignOpen} title="Assign package (cash)" onClose={() => setAssignOpen(false)}>
        <form onSubmit={onAssign} className="space-y-3">
          <p className="text-sm text-slate-400">Clinic: {selectedClinic?.name}</p>
          <Select
            label="Package"
            value={packageId}
            onChange={(e) => {
              setPackageId(e.target.value);
              const pkg = packages.find((p) => String(p.id) === e.target.value);
              if (pkg) setAmount(pkg.price);
            }}
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — Rs {p.price}
              </option>
            ))}
          </Select>
          <Input label="Cash amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Assigning…" : "Confirm cash & activate"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
