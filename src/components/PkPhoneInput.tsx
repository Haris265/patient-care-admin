"use client";

import { digitsOnly, isValidPkMobileNational, toPkMobileNational } from "@/lib/pkFormat";

type Props = {
  label?: string;
  value: string;
  onChange: (national10: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
};

/**
 * Pakistan mobile input: 🇵🇰 +92 | 10 digits starting with 3.
 * `value` / `onChange` use national form without leading 0 (3XXXXXXXXX).
 */
export function PkPhoneInput({
  label = "Phone",
  value,
  onChange,
  required,
  disabled,
  className = "",
  error,
}: Props) {
  const national = toPkMobileNational(value);
  const showError =
    error ||
    (national.length > 0 && !isValidPkMobileNational(national)
      ? "Enter 10-digit Pakistani mobile (3XXXXXXXXX)"
      : "");

  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label ? (
        <span className="text-xs font-medium text-[var(--premium-label)]">{label}</span>
      ) : null}
      <div
        className={`flex overflow-hidden rounded-xl border bg-[var(--premium-field-bg)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] transition focus-within:border-accent-400/60 focus-within:ring-2 focus-within:ring-brand-500/20 ${
          showError
            ? "border-red-400/50"
            : "border-[var(--premium-border)]"
        }`}
      >
        <span className="flex shrink-0 items-center gap-1.5 border-r border-[var(--premium-border)] bg-slate-900/50 px-3 text-sm text-slate-200">
          <span aria-hidden className="text-base leading-none">
            🇵🇰
          </span>
          <span className="font-medium tabular-nums">+92</span>
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="3XXXXXXXXX"
          maxLength={10}
          required={required}
          disabled={disabled}
          value={national}
          onChange={(e) => {
            const next = digitsOnly(e.target.value).slice(0, 10);
            onChange(next);
          }}
          className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm tabular-nums text-[var(--premium-field-text)] placeholder:text-[var(--premium-field-placeholder)] outline-none disabled:opacity-50"
        />
      </div>
      {showError ? (
        <span className="text-xs text-red-300">{showError}</span>
      ) : (
        <span className="text-xs text-slate-500">10 digits, starts with 3</span>
      )}
    </label>
  );
}
