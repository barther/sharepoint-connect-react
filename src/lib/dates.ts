import { format, formatDistanceToNow } from "date-fns";

// SharePoint columns can come back empty, malformed, or as values that
// crash `new Date()`. Wrapping every format site keeps a single bad row
// from blanking the whole page.

const toValidDate = (input: string | number | Date | undefined | null): Date | null => {
  if (input === undefined || input === null || input === "") return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  // Plain `YYYY-MM-DD` strings (date-only, no time component) get parsed as
  // UTC midnight by the Date constructor, which displays as the previous day
  // in any negative-offset timezone (e.g. Eastern). Detect and parse as
  // local-time components so dates round-trip correctly.
  if (typeof input === "string") {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const safeFormat = (
  input: string | number | Date | undefined | null,
  fmt: string,
  fallback = "—"
): string => {
  const d = toValidDate(input);
  return d ? format(d, fmt) : fallback;
};

export const safeDistance = (
  input: string | number | Date | undefined | null,
  fallback = ""
): string => {
  const d = toValidDate(input);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : fallback;
};

// Returns a numeric timestamp suitable for `sort` comparators. Falls back to 0
// so invalid dates sort to the bottom rather than producing NaN comparisons
// (which leave sort order undefined).
export const safeTime = (input: string | number | Date | undefined | null): number => {
  const d = toValidDate(input);
  return d ? d.getTime() : 0;
};

// Whole days between `input` and now. Negative or zero if the input is missing
// or in the future — never NaN.
export const daysSince = (input: string | number | Date | undefined | null): number => {
  const t = safeTime(input);
  if (!t) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
};

// Short, scannable age label: "12d", "8mo", "1y", "1y 4mo".
export const shortAge = (days: number): string => {
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m === 0 ? `${y}y` : `${y}y ${m}mo`;
};

// 6 months — the threshold above which a request is "stale" enough that the
// app surfaces its age and includes it in the cleanup banner.
export const STALE_DAYS = 180;
