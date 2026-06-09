/** Parse an extracted "DD-MM-YYYY" due date into a UTC Date, or null. */
export function parseDdmmyyyy(s?: string | null): Date | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
  return Number.isNaN(d.getTime()) ? null : d;
}
