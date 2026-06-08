/**
 * Indian-locale formatting helpers (DoD: ₹ lakh/crore grouping, units, DD-MM-YYYY).
 * Pure functions — safe to use anywhere, no side effects.
 */

/** Format a number in the Indian numbering system, e.g. 1234567 -> "12,34,567". */
export function formatIndianNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Format rupees, e.g. 1234567 -> "₹12,34,567". */
export function formatRupees(value: number, fractionDigits = 0): string {
  return `₹${formatIndianNumber(value, fractionDigits)}`;
}

/** Compact rupee form for headline numbers, e.g. 1234567 -> "₹12.3L", 23400000 -> "₹2.34Cr". */
export function formatRupeesCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${formatIndianNumber(abs)}`;
}

/** Format energy with unit, e.g. (1500, "kWh") -> "1,500 kWh". */
export function formatUnit(value: number, unit: string, fractionDigits = 0): string {
  return `${formatIndianNumber(value, fractionDigits)} ${unit}`;
}

/** Format a date as DD-MM-YYYY. Accepts Date or ISO string. */
export function formatDate(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
