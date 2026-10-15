"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  CreditCard,
  Package,
  Stethoscope,
  X,
} from "lucide-react";

import { api, unwrapCount, unwrapList } from "@/lib/api";
import type { BillingInvoice, ClinicBilling, ClinicSubscription } from "@/lib/types";
import { Badge, Button, Card, PageHeader, Skeleton } from "@/components/ui";

export default function ClinicDashboardPage() {
  const [me, setMe] = useState<ClinicBilling | null>(null);
  const [offers, setOffers] = useState<ClinicSubscription[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [packagesCount, setPackagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    try {
      const clinic = await api.clinicMe();
      setMe(clinic);
      const [offerData, invoiceData, packages] = await Promise.all([
        api.clinicOffers({ status: "pending_clinic" }),
        api.clinicInvoices({ page_size: "20" }),
        api.clinicPackages({ page_size: "1" }),
      ]);
      setOffers(unwrapList(offerData));
      setInvoices(unwrapList(invoiceData));
      setPackagesCount(unwrapCount(packages));

      if (!clinic.access_locked) {
        const [doctors, appointments] = await Promise.all([
          api.clinicDoctors({ page_size: "1" }),
          api.clinicAppointments({ page_size: "1" }),
        ]);
        setDoctorsCount(unwrapCount(doctors));
        setAppointmentsCount(unwrapCount(appointments));
      } else {
        setDoctorsCount(0);
        setAppointmentsCount(0);
      }
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

  async function onAccept(uuid: string) {
    setBusy(uuid);
    try {
      await api.acceptOffer(uuid);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accept failed");
    } finally {
      setBusy("");
    }
  }

  async function onReject(uuid: string) {
    if (!window.confirm("Reject this package offer?")) return;
    setBusy(uuid);
    try {
      await api.rejectOffer(uuid);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy("");
    }
  }

  async function onSubmitPayment(uuid: string) {
    setBusy(uuid);
    try {
      await api.submitInvoicePayment(uuid);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy("");
    }
  }

  const summary = me?.payment_summary;
  const due = summary?.due ?? "0.00";
  const locked = Boolean(me?.access_locked);
  const blockingInvoice = invoices.find(
    (i) =>
      i.uuid === me?.blocking_invoice_uuid ||
      i.status === "pending" ||
      i.status === "overdue" ||
      i.status === "pending_verification",
  );
  const expired =
    summary?.package_status === "expired" || me?.lock_reason === "expired";

  const cards: {
    label: string;
    value: string | number;
    icon: typeof Stethoscope;
    href: string;
  }[] = [
    {
      label: "Doctors",
      value: locked ? "—" : doctorsCount,
      icon: Stethoscope,
      href: locked ? "/clinic/dashboard" : "/clinic/doctors",
    },
    {
      label: "Appointments",
      value: locked ? "—" : appointmentsCount,
      icon: CalendarDays,
      href: locked ? "/clinic/dashboard" : "/clinic/appointments",
    },
    {
      label: "Packages",
      value: packagesCount,
      icon: Package,
      href: "/clinic/packages",
    },
    {
      label: "Amount due",
      value: `Rs ${due}`,
      icon: CreditCard,
      href: "/clinic/invoices",
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-6">
      <PageHeader
        title={me?.name ? me.name : "Clinic dashboard"}
        subtitle="Overview of doctors, appointments, packages, and payments."
      />
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {locked && !loading ? (
        <Card className="border border-amber-400/30 bg-amber-500/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-amber-100">Clinic locked</h3>
              <p className="mt-1 text-sm text-amber-100/80">
                {me?.lock_reason === "awaiting_accept"
                  ? "Accept the package offer below to continue."
                  : me?.lock_reason === "awaiting_payment"
                    ? "Pay the outstanding invoice to unlock doctors and appointments."
                    : "Your package has expired. Request renewal from Packages."}
              </p>
            </div>
            <Badge tone="warning">{me?.lock_reason || "locked"}</Badge>
          </div>
        </Card>
      ) : null}

      {offers.length > 0 ? (
        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-semibold text-white">Package offers</h3>
          {offers.map((offer) => (
            <div
              key={offer.uuid}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <div className="font-medium text-slate-100">{offer.package_name}</div>
                <div className="text-xs text-slate-400">
                  {offer.package_code} · {offer.start_date} → {offer.end_date}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={busy === offer.uuid}
                  onClick={() => onAccept(offer.uuid)}
                >
                  <Check size={14} /> Accept
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy === offer.uuid}
                  onClick={() => onReject(offer.uuid)}
                >
                  <X size={14} /> Reject
                </Button>
              </div>
            </div>
          ))}
        </Card>
      ) : null}

      {blockingInvoice ? (
        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-semibold text-white">Outstanding invoice</h3>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <div className="font-medium text-slate-100">{blockingInvoice.package_name}</div>
              <div className="text-xs text-slate-400">
                Rs {blockingInvoice.amount} · Due {blockingInvoice.due_date} ·{" "}
                {blockingInvoice.status}
              </div>
            </div>
            {blockingInvoice.status === "pending" || blockingInvoice.status === "overdue" ? (
              <Button
                type="button"
                disabled={busy === blockingInvoice.uuid}
                onClick={() => onSubmitPayment(blockingInvoice.uuid)}
              >
                <CreditCard size={14} /> Submit payment
              </Button>
            ) : (
              <Badge tone="warning">Awaiting superadmin confirmation</Badge>
            )}
          </div>
          <Link href="/clinic/invoices" className="text-sm text-brand-300 hover:underline">
            View all invoices →
          </Link>
        </Card>
      ) : null}

      {expired ? (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white">Renew package</h3>
          <p className="mt-1 text-sm text-slate-400">
            Your subscription has expired. Request a renewal from the Packages page.
          </p>
          <Link href="/clinic/packages" className="mt-3 inline-block">
            <Button type="button">
              <Package size={14} /> Go to packages
            </Button>
          </Link>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)
          : cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className={`premium-card premium-hover-lift animate-fade-in-up stagger-${Math.min(i + 1, 4)} block rounded-3xl p-5 no-underline`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {card.label}
                      </p>
                      <p
                        className="mt-2 truncate text-2xl font-bold text-white"
                        title={String(card.value)}
                      >
                        {card.value}
                      </p>
                    </div>
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white depth-raised"
                      style={{
                        background:
                          "linear-gradient(145deg, #3d9a82 0%, #145D4F 55%, #0b322b 100%)",
                      }}
                    >
                      <Icon size={18} />
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>

      {!loading && me ? (
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-semibold text-white">Clinic details</h3>
          <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <div>
              <span className="text-slate-500">Location: </span>
              {[me.area, me.city].filter(Boolean).join(", ") || me.address || "—"}
            </div>
            <div>
              <span className="text-slate-500">Phone: </span>
              {me.phone || "—"}
            </div>
            <div>
              <span className="text-slate-500">Package: </span>
              {summary?.package_name || "—"} ({summary?.package_status || "none"})
            </div>
            <div>
              <span className="text-slate-500">Ledger balance: </span>
              Rs {summary?.ledger_balance ?? me.ledger_balance ?? "0.00"}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
