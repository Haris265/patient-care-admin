/** Pakistan (en-PK) date/phone display helpers. */

export function formatPkDate(isoDate: string): string {
  if (!isoDate) return "—";
  const d = isoDate.includes("T")
    ? new Date(isoDate)
    : new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatPkDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-PK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPkTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-PK", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Digits only from any phone string. */
export function digitsOnly(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Normalize stored/API phone to 10-digit national mobile (3XXXXXXXXX).
 * Accepts 03…, 92…, or bare 3….
 */
export function toPkMobileNational(phone: string): string {
  let d = digitsOnly(phone);
  if (d.startsWith("92") && d.length >= 12) d = d.slice(2);
  if (d.startsWith("0") && d.length >= 11) d = d.slice(1);
  return d.slice(0, 10);
}

/** Validate 10-digit PK mobile starting with 3. */
export function isValidPkMobileNational(national: string): boolean {
  return /^3\d{9}$/.test(national);
}

/** API storage form: 03XXXXXXXXX */
export function toPkMobileLocal(national: string): string {
  const n = toPkMobileNational(national);
  return n ? `0${n}` : "";
}

/** Display: +92 3XX XXXXXXX */
export function formatPkPhone(phone: string): string {
  const n = toPkMobileNational(phone);
  if (n.length === 10) {
    return `+92 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  }
  const d = digitsOnly(phone);
  return d || phone || "—";
}
