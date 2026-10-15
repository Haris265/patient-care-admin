"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Doctor } from "@/lib/types";

type Props = {
  doctors: Doctor[];
  value: string;
  onChange: (doctorId: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
};

export function DoctorTypeahead({
  doctors,
  value,
  onChange,
  label = "Doctor",
  required,
  placeholder = "Type to search doctor…",
}: Props) {
  const selected = doctors.find((d) => String(d.id) === value) || null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery(selected ? `Dr. ${selected.full_name}` : "");
    }
  }, [selected, open, value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^dr\.?\s*/i, "");
    if (!q || (selected && query === `Dr. ${selected.full_name}`)) {
      return doctors;
    }
    return doctors.filter((d) => {
      const name = d.full_name.toLowerCase();
      const email = (d.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [doctors, query, selected]);

  return (
    <div ref={rootRef} className="relative block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium text-[var(--premium-label)]">{label}</span>
      ) : null}
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        required={required && !value}
        placeholder={placeholder}
        value={query}
        onFocus={() => {
          setOpen(true);
          if (selected) setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        className="w-full rounded-xl border border-[var(--premium-border)] bg-[var(--premium-field-bg)] px-3.5 py-2.5 text-sm text-[var(--premium-field-text)] placeholder:text-[var(--premium-field-placeholder)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] outline-none transition focus:border-accent-400/60 focus:ring-2 focus:ring-brand-500/20"
      />
      {/* Keep native required working when value empty */}
      <input type="hidden" value={value} required={required} readOnly />
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 py-1 shadow-xl">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">No doctors found</li>
          ) : (
            filtered.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-brand-500/15 ${
                    String(d.id) === value ? "bg-brand-500/10 text-brand-100" : "text-slate-100"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(String(d.id));
                    setQuery(`Dr. ${d.full_name}`);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">Dr. {d.full_name}</span>
                  {d.email ? (
                    <span className="text-xs text-slate-400">{d.email}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
