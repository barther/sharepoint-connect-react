import type { PrayerStatus } from "@/lib/prayer-types";

const styles: Record<PrayerStatus, string> = {
  Active: "bg-primary text-primary-foreground",
  Ongoing: "bg-ongoing text-ongoing-foreground",
  Resolved: "bg-resolved text-resolved-foreground",
  Archived: "bg-muted text-muted-foreground border border-foreground/15",
};

export const StatusBadge = ({ status }: { status: PrayerStatus }) => (
  <span
    className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${styles[status]}`}
  >
    {status}
  </span>
);
