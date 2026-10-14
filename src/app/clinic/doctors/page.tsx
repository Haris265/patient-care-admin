"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

import { api, unwrapCount, unwrapList } from "@/lib/api";
import type { Doctor } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  PaginationBar,
  Skeleton,
} from "@/components/ui";

const PAGE_SIZE = 10;

export default function ClinicDoctorsPage() {
  const [items, setItems] = useState<Doctor[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Doctors"
        subtitle="Clinicians linked to your clinic."
      />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by name or email"
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
              title="No doctors linked"
              description="Doctors assigned to this clinic will appear here."
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
                      <Link href={`/clinic/doctors/${d.uuid}`}>
                        <IconButton tone="edit" title="View detail">
                          <Eye size={15} strokeWidth={1.75} />
                        </IconButton>
                      </Link>
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
    </div>
  );
}
