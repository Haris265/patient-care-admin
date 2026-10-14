"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { api, unwrapList } from "@/lib/api";
import type { BillingPackage, PurchaseRequest } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@/components/ui";

export default function ClinicPackagesPage() {
  const [packages, setPackages] = useState<BillingPackage[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [pkgs, reqs] = await Promise.all([
        api.clinicPackages(),
        api.clinicPurchaseRequests({ page_size: "50" }),
      ]);
      setPackages(unwrapList(pkgs));
      setRequests(unwrapList(reqs));
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

  async function requestBuy(pkg: BillingPackage) {
    setBusyId(pkg.id);
    try {
      await api.createPurchaseRequest({ package_id: pkg.id });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  const pendingFor = (packageId: number) =>
    requests.some((r) => r.package === packageId && r.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packages"
        subtitle="Choose a package and request purchase. Superadmin confirms cash payment."
      />
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : packages.length === 0 ? (
        <EmptyState title="No packages" description="No active packages are available right now." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.uuid} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{pkg.code}</p>
                </div>
                <Badge tone="info">{pkg.duration_days} days</Badge>
              </div>
              <p className="mt-3 flex-1 text-sm text-slate-300">{pkg.description || "—"}</p>
              <p className="mt-4 text-2xl font-bold text-emerald-300">Rs {pkg.price}</p>
              <p className="mt-1 text-xs text-slate-400">
                Up to {pkg.max_doctors} doctors · {pkg.max_patients} patients
              </p>
              <Button
                type="button"
                className="mt-4 w-full"
                disabled={busyId === pkg.id || pendingFor(pkg.id)}
                onClick={() => requestBuy(pkg)}
              >
                <ShoppingCart size={16} />
                {pendingFor(pkg.id)
                  ? "Request pending"
                  : busyId === pkg.id
                    ? "Requesting…"
                    : "Request purchase"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Your requests</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-400">No purchase requests yet.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li
                key={r.uuid}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-100">{r.package_name}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <Badge
                  tone={
                    r.status === "approved"
                      ? "success"
                      : r.status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {r.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
