"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Search…",
  required = false,
  className = "",
  allowEmpty = false,
  emptyLabel = "All",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  const selected = options.find((o) => o.value === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      if (selected) {
        setQuery(selected.label);
      } else if (allowEmpty && !value) {
        setQuery(emptyLabel);
      } else {
        setQuery("");
      }
    }
  }, [selected, selected?.label, value, open, allowEmpty, emptyLabel]);

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
    const q = query.trim().toLowerCase();
    const isIdle =
      !q ||
      (selected && q === selected.label.toLowerCase()) ||
      (allowEmpty && !value && q === emptyLabel.toLowerCase());
    if (isIdle) {
      return options;
    }
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q)),
    );
  }, [options, query, selected, allowEmpty, value, emptyLabel]);

  function pick(next: string, nextLabel: string) {
    onChange(next);
    setQuery(nextLabel);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative block space-y-1.5 ${className}`}>
      {label ? (
        <span className="text-xs font-medium text-[var(--premium-label)]">{label}</span>
      ) : null}
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          required={required && !value}
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            if (allowEmpty && !value && query === emptyLabel) {
              setQuery("");
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (selected && e.target.value !== selected.label) {
              onChange("");
            }
          }}
          className="w-full rounded-xl border border-[var(--premium-border)] bg-[var(--premium-field-bg)] px-3.5 py-2.5 pr-9 text-sm text-[var(--premium-field-text)] caret-[var(--premium-field-text)] placeholder:text-[var(--premium-field-placeholder)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] outline-none transition focus:border-accent-400/60 focus:ring-2 focus:ring-brand-500/20"
        />
        {value || query ? (
          <button
            type="button"
            aria-label="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-slate-400 hover:text-slate-200"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(true);
            }}
          >
            ✕
          </button>
        ) : null}
      </div>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--premium-border)] bg-[var(--premium-field-bg)] py-1 shadow-lg"
        >
          {allowEmpty ? (
            <li>
              <button
                type="button"
                className="flex w-full flex-col px-3.5 py-2 text-left text-sm text-slate-300 hover:bg-white/10"
                onClick={() => pick("", emptyLabel)}
              >
                {emptyLabel}
              </button>
            </li>
          ) : null}
          {filtered.length === 0 ? (
            <li className="px-3.5 py-2 text-sm text-slate-500">No matches</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className={`flex w-full flex-col px-3.5 py-2 text-left hover:bg-white/10 ${
                    o.value === value ? "bg-white/5" : ""
                  }`}
                  onClick={() => pick(o.value, o.label)}
                >
                  <span className="text-sm text-[var(--premium-field-text)]">{o.label}</span>
                  {o.sublabel ? (
                    <span className="text-xs text-slate-400">{o.sublabel}</span>
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

export function Button({
  children,
  variant = "primary",
  className = "",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "shine-hover press-btn text-white border border-accent-400/20 shadow-[0_0_24px_-14px_rgba(20,93,79,0.9)] disabled:opacity-50",
    secondary:
      "bg-slate-800/80 text-slate-100 border border-slate-600/60 hover:bg-slate-700/80 disabled:opacity-50",
    ghost: "bg-transparent text-slate-200 hover:bg-white/5 disabled:opacity-50",
    danger: "bg-gradient-to-b from-red-500 to-red-700 text-white disabled:opacity-50",
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles} ${className}`}
      style={
        variant === "primary"
          ? {
              background: "linear-gradient(145deg, #3d9a82 0%, #145D4F 55%, #0b322b 100%)",
              ...style,
            }
          : style
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  tone = "neutral",
  className = "",
  title,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "neutral" | "edit" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral:
      "border-slate-600/50 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:bg-slate-700/80 hover:text-slate-100",
    edit: "border-accent-500/25 bg-brand-500/10 text-accent-400 hover:border-accent-400/40 hover:bg-brand-500/20 hover:text-brand-200",
    success:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/40 hover:bg-emerald-500/20 hover:text-emerald-200",
    warning:
      "border-amber-500/25 bg-amber-500/10 text-amber-300 hover:border-amber-400/40 hover:bg-amber-500/20 hover:text-amber-200",
    danger:
      "border-red-500/25 bg-red-500/10 text-red-300 hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200",
  }[tone];

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition duration-150 disabled:opacity-50 ${tones} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium text-[var(--premium-label)]">{label}</span>
      ) : null}
      <input
        className={`w-full rounded-xl border border-[var(--premium-border)] bg-[var(--premium-field-bg)] px-3.5 py-2.5 text-sm text-[var(--premium-field-text)] caret-[var(--premium-field-text)] placeholder:text-[var(--premium-field-placeholder)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] outline-none transition focus:border-accent-400/60 focus:ring-2 focus:ring-brand-500/20 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_var(--premium-field-bg)] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--premium-field-text)] [&:-webkit-autofill]:caret-[var(--premium-field-text)] ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium text-[var(--premium-label)]">{label}</span>
      ) : null}
      <select
        className={`w-full rounded-xl border border-[var(--premium-border)] bg-[var(--premium-field-bg)] px-3.5 py-2.5 text-sm text-[var(--premium-field-text)] outline-none transition focus:border-accent-400/60 focus:ring-2 focus:ring-brand-500/20 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`premium-card premium-card-glow rounded-3xl ${className}`}>{children}</div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const styles = {
    neutral: "bg-slate-700/80 text-slate-200",
    success: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/20",
    warning: "bg-amber-500/20 text-amber-200 border border-amber-400/20",
    danger: "bg-red-500/20 text-red-300 border border-red-400/20",
    info: "bg-brand-500/20 text-brand-100 border border-accent-400/20",
  }[tone];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-700/50 ${className}`} />;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-600/70 bg-slate-900/40 px-6 py-12 text-center">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className={`premium-card premium-card-glow relative z-10 flex max-h-[90vh] w-full flex-col animate-fade-in-up rounded-3xl p-6 ${
          className.includes("max-w-") ? "" : "max-w-lg"
        } ${className}`}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-lg font-bold text-slate-50">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/5 hover:text-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">{children}</div>
      </div>
    </div>
  );
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/70 px-5 py-3">
      <p className="text-xs text-slate-400">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs font-medium text-slate-300">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
