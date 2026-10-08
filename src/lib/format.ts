/** Currency, optionally signed for credit (+) / debit (-) presentation. */
export function formatMoney(value: number, currency = "USD", signed?: "credit" | "debit"): string {
  const base = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  return signed === "credit" ? `+${base}` : signed === "debit" ? `-${base}` : base;
}

function toDate(iso: string): Date {
  // Date-only strings are anchored at noon so timezones never shift the day.
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
}

/** "Oct 4, 2026" — the standard display date used across the app. */
export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }): string {
  return new Intl.DateTimeFormat("en-US", opts).format(toDate(iso));
}

/** "October 4, 2026" — used in detail views. */
export function formatDateLong(iso: string): string {
  return formatDate(iso, { month: "long", day: "numeric", year: "numeric" });
}

/** "Oct 4" — compact form for tight mobile layouts. */
export function formatDateCompact(iso: string): string {
  return formatDate(iso, { month: "short", day: "numeric" });
}

export function greeting(date = new Date(), words: { goodMorning: string; goodAfternoon: string; goodEvening: string } = { goodMorning: "Good morning", goodAfternoon: "Good afternoon", goodEvening: "Good evening" }): string {
  const h = date.getHours();
  return h < 12 ? words.goodMorning : h < 18 ? words.goodAfternoon : words.goodEvening;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** "Oct 7, 2026, 4:44 PM" */
export function formatDateTime(iso: string): string {
  return formatDate(iso, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatLastLogin(iso: string | null): string {
  return iso ? formatDateTime(iso) : "Never";
}
