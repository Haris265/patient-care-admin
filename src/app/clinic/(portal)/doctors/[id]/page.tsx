"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { api } from "@/lib/api";
import { formatPkDate, formatPkPhone, formatPkTime } from "@/lib/pkFormat";
import type { ClinicDoctorDetail } from "@/lib/types";
import { Badge, Button, Card, PageHeader, Skeleton } from "@/components/ui";

function money(v: string | undefined) {
  if (!v) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return `Rs ${n.toLocaleString("en-PK")}`;
}

function timeShort(t: string) {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export default function ClinicDoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = String(params.id || "");
  const [doctor, setDoctor] = useState<ClinicDoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingNormal, setSavingNormal] = useState(false);
  const [savingDiscounted, setSavingDiscounted] = useState(false);
  const [sessionTime, setSessionTime] = useState(15);
  const [isActive, setIsActive] = useState(true);
  const [commissionType, setCommissionType] = useState("percentage");
  const [commissionValue, setCommissionValue] = useState("20");
  const [discountedCommissionType, setDiscountedCommissionType] =
    useState("percentage");
  const [discountedCommissionValue, setDiscountedCommissionValue] =
    useState("20");
  const [consultationFee, setConsultationFee] = useState("");

  const reload = () => {
    if (!uuid) return;
    setLoading(true);
    api
      .clinicDoctor(uuid)
      .then((d) => {
        setDoctor(d);
        setSessionTime(d.session_time);
        setIsActive(d.is_active);
        setCommissionType(d.clinic_link?.commission_type || "percentage");
        setCommissionValue(d.clinic_link?.commission_value || "20");
        setDiscountedCommissionType(
          d.clinic_link?.discounted_commission_type || "percentage",
        );
        setDiscountedCommissionValue(
          d.clinic_link?.discounted_commission_value || "20",
        );
        setConsultationFee(d.consultation_fee || "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const doctorPctLabel = useMemo(() => {
    if (commissionType !== "percentage") return null;
    const clinicPct = Number(commissionValue);
    if (Number.isNaN(clinicPct)) return null;
    return Math.max(0, Math.round((100 - clinicPct) * 100) / 100);
  }, [commissionType, commissionValue]);

  const discountedDoctorPctLabel = useMemo(() => {
    if (discountedCommissionType !== "percentage") return null;
    const clinicPct = Number(discountedCommissionValue);
    if (Number.isNaN(clinicPct)) return null;
    return Math.max(0, Math.round((100 - clinicPct) * 100) / 100);
  }, [discountedCommissionType, discountedCommissionValue]);

  function previewSplit(
    feeRaw: string,
    type: string,
    valueRaw: string,
  ): { fee: number; clinicShare: number; doctorShare: number } | null {
    const fee = Number(feeRaw);
    const val = Number(valueRaw);
    if (Number.isNaN(fee) || fee < 0 || Number.isNaN(val) || val < 0) return null;
    let clinicShare: number;
    if (type === "percentage") {
      const pct = Math.min(100, Math.max(0, val));
      clinicShare = (fee * pct) / 100;
    } else {
      clinicShare = Math.min(fee, val);
    }
    clinicShare = Math.round(clinicShare * 100) / 100;
    const doctorShare = Math.round((fee - clinicShare) * 100) / 100;
    return { fee, clinicShare, doctorShare };
  }

  /** Live per-visit split from current fee + % / fixed inputs (before save). */
  const liveSplit = useMemo(
    () => previewSplit(consultationFee, commissionType, commissionValue),
    [commissionType, commissionValue, consultationFee],
  );

  const liveDiscountedSplit = useMemo(
    () =>
      previewSplit(
        consultationFee,
        discountedCommissionType,
        discountedCommissionValue,
      ),
    [discountedCommissionType, discountedCommissionValue, consultationFee],
  );

  function applyDoctorState(updated: ClinicDoctorDetail) {
    setDoctor(updated);
    setSessionTime(updated.session_time);
    setIsActive(updated.is_active);
    setCommissionType(updated.clinic_link.commission_type);
    setCommissionValue(updated.clinic_link.commission_value);
    setDiscountedCommissionType(
      updated.clinic_link.discounted_commission_type || "percentage",
    );
    setDiscountedCommissionValue(
      updated.clinic_link.discounted_commission_value || "20",
    );
    setConsultationFee(updated.consultation_fee || "");
  }

  async function saveSettings() {
    if (!uuid) return;
    setSavingSettings(true);
    setError("");
    try {
      const updated = await api.patchClinicDoctor(uuid, {
        session_time: sessionTime,
        is_active: isActive,
        consultation_fee: consultationFee || undefined,
      });
      applyDoctorState(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveNormalCommission() {
    if (!uuid) return;
    setSavingNormal(true);
    setError("");
    try {
      const updated = await api.patchClinicDoctor(uuid, {
        commission_type: commissionType,
        commission_value: commissionValue,
      });
      applyDoctorState(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save commission");
    } finally {
      setSavingNormal(false);
    }
  }

  async function saveDiscountedCommission() {
    if (!uuid) return;
    setSavingDiscounted(true);
    setError("");
    try {
      const updated = await api.patchClinicDoctor(uuid, {
        discounted_commission_type: discountedCommissionType,
        discounted_commission_value: discountedCommissionValue,
      });
      applyDoctorState(updated);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to save discounted commission",
      );
    } finally {
      setSavingDiscounted(false);
    }
  }

  async function removeFromClinic() {
    if (!doctor) return;
    if (
      !window.confirm(
        `Remove Dr. ${doctor.full_name} from this clinic? Their account will remain.`,
      )
    ) {
      return;
    }
    try {
      await api.deleteClinicDoctor(doctor.uuid);
      router.push("/clinic/doctors");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/clinic/doctors">
          <Button variant="secondary" className="px-3 py-2">
            <ArrowLeft size={16} />
            Back
          </Button>
        </Link>
        {doctor ? (
          <Button variant="danger" onClick={removeFromClinic}>
            Remove from clinic
          </Button>
        ) : null}
      </div>

      <PageHeader
        title={doctor ? `Dr. ${doctor.full_name}` : "Doctor detail"}
        subtitle="Schedule, patients, fees, and normal / discounted commission splits."
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
      ) : doctor ? (
        <>
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-1 font-medium text-slate-100">{doctor.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Session</p>
                <p className="mt-1 font-medium text-slate-100">{doctor.session_time} min</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Fee</p>
                <p className="mt-1 font-medium text-slate-100">
                  {money(doctor.consultation_fee)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                <div className="mt-1">
                  <Badge tone={doctor.is_active ? "success" : "neutral"}>
                    {doctor.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Specialities</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {doctor.specialities.map((s) => (
                    <Badge key={s.id} tone="info">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Patients", String(doctor.stats.patient_count)],
              ["Upcoming", String(doctor.stats.upcoming_count)],
              ["Completed", String(doctor.stats.completed_count)],
              ["Gross fees", money(doctor.stats.gross_fees)],
              ["Clinic take", money(doctor.stats.clinic_commission_total)],
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-100">Clinic settings</h3>
            <p className="mt-1 text-sm text-slate-400">
              Session length, status, and consultation fee for this clinic.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm text-slate-300">
                Session (minutes)
                <input
                  type="number"
                  min={5}
                  max={240}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(Number(e.target.value))}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Consultation fee
                <input
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 sm:mt-7">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active
              </label>
            </div>
            <div className="mt-4">
              <Button onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? "Saving…" : "Save settings"}
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">
                Normal commission split
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Applied for normal (non-discounted) visits.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Type
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value)}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed PKR</option>
                  </select>
                </label>
                <label className="block text-sm text-slate-300">
                  Clinic {commissionType === "percentage" ? "%" : "amount"}
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-300">
                <p>
                  {commissionType === "percentage" && doctorPctLabel !== null
                    ? `Clinic ${commissionValue}% · Doctor ${doctorPctLabel}%`
                    : `Clinic fixed ${money(commissionValue)} · Doctor = fee − clinic`}
                </p>
                {liveSplit ? (
                  <p className="text-slate-200">
                    Per visit @ {money(String(liveSplit.fee))} → Clinic{" "}
                    {money(String(liveSplit.clinicShare))} · Doctor{" "}
                    {money(String(liveSplit.doctorShare))}
                  </p>
                ) : (
                  <p className="text-slate-500">
                    Enter a valid fee and commission to preview.
                  </p>
                )}
                <p className="text-slate-400">
                  Doctor earnings so far (saved rates):{" "}
                  {money(doctor.stats.doctor_earnings_total)} · Clinic take:{" "}
                  {money(doctor.stats.clinic_commission_total)}
                </p>
              </div>
              <div className="mt-4">
                <Button onClick={saveNormalCommission} disabled={savingNormal}>
                  {savingNormal ? "Saving…" : "Save"}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">
                Discounted commission split
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Applied when the appointment patient type is discounted (jamat).
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Type
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    value={discountedCommissionType}
                    onChange={(e) => setDiscountedCommissionType(e.target.value)}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed PKR</option>
                  </select>
                </label>
                <label className="block text-sm text-slate-300">
                  Clinic{" "}
                  {discountedCommissionType === "percentage" ? "%" : "amount"}
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    value={discountedCommissionValue}
                    onChange={(e) => setDiscountedCommissionValue(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-300">
                <p>
                  {discountedCommissionType === "percentage" &&
                  discountedDoctorPctLabel !== null
                    ? `Clinic ${discountedCommissionValue}% · Doctor ${discountedDoctorPctLabel}%`
                    : `Clinic fixed ${money(discountedCommissionValue)} · Doctor = fee − clinic`}
                </p>
                {liveDiscountedSplit ? (
                  <p className="text-slate-200">
                    Per discounted visit @ {money(String(liveDiscountedSplit.fee))} →
                    Clinic {money(String(liveDiscountedSplit.clinicShare))} · Doctor{" "}
                    {money(String(liveDiscountedSplit.doctorShare))}
                  </p>
                ) : (
                  <p className="text-slate-500">
                    Enter a valid fee and commission to preview.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <Button
                  onClick={saveDiscountedCommission}
                  disabled={savingDiscounted}
                >
                  {savingDiscounted ? "Saving…" : "Save"}
                </Button>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">Weekly schedule</h3>
              <div className="mt-3 space-y-2">
                {doctor.availability.weekly.length === 0 ? (
                  <p className="text-sm text-slate-400">No weekly windows.</p>
                ) : (
                  doctor.availability.weekly.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-200">{w.weekday_label}</span>
                      <span className="text-slate-400">
                        {timeShort(w.start_time)} – {timeShort(w.end_time)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">Upcoming open slots</h3>
              <div className="mt-3 space-y-3">
                {doctor.upcoming_slots.length === 0 ? (
                  <p className="text-sm text-slate-400">No open slots in the next week.</p>
                ) : (
                  doctor.upcoming_slots.map((day) => (
                    <div key={day.date}>
                      <p className="text-sm font-medium text-slate-200">{day.date_label}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {day.times.map((t) => (
                          <Badge key={t} tone="neutral">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-800 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-100">Appointments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date / time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Fee</th>
                    <th className="px-4 py-3">Clinic</th>
                    <th className="px-4 py-3">Doctor</th>
                  </tr>
                </thead>
                <tbody>
                  {doctor.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-slate-400">
                        No appointments yet.
                      </td>
                    </tr>
                  ) : (
                    doctor.appointments.map((a) => (
                      <tr key={a.id} className="border-t border-slate-800">
                        <td className="px-4 py-3 text-slate-100">
                          <div>{a.patient_name}</div>
                          <div className="text-xs text-slate-500">
                            🇵🇰 {formatPkPhone(a.patient_phone)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {a.patient_type === "discounted" ? (
                            <div>
                              <Badge tone="info">Discounted</Badge>
                              {a.jamat_name ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  {a.jamat_name}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <Badge tone="neutral">Normal</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatPkDate(a.token_date)}
                          {a.scheduled_at ? ` · ${formatPkTime(a.scheduled_at)}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              a.status === "completed"
                                ? "success"
                                : a.status === "upcoming"
                                  ? "info"
                                  : "neutral"
                            }
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-200">{money(a.fee_base)}</td>
                        <td className="px-4 py-3 text-slate-200">{money(a.clinic_share)}</td>
                        <td className="px-4 py-3 text-slate-200">{money(a.doctor_share)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-100">Patients</h3>
            <div className="mt-3 divide-y divide-slate-800">
              {doctor.patients.length === 0 ? (
                <p className="text-sm text-slate-400">No patients linked yet.</p>
              ) : (
                doctor.patients.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-100">{p.name}</p>
                      <p className="text-slate-500">🇵🇰 {formatPkPhone(p.phone)}</p>
                    </div>
                    <Badge tone="info">{p.visit_count} visits</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
