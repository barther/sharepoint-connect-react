import { format, formatDistanceToNow } from "date-fns";

// SharePoint columns can come back empty, malformed, or as values that
// crash `new Date()`. Wrapping every format site keeps a single bad row
// from blanking the whole page.

const toValidDate = (input: string | number | Date | undefined | null): Date | null => {
  if (input === undefined || input === null || input === "") return null;
  const d = input instanceof Date ? input : new Date(input);
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
