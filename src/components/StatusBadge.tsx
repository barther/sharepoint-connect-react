import type { PrayerStatus } from "@/lib/prayer-types";

const styles: Record<PrayerStatus, string> = {
  Active: "text-primary border-primary/40",
  Ongoing: "text-ongoing border-ongoing/40",
  Resolved: "text-resolved border-resolved/40",
  Archived: "text-muted-foreground border-muted-foreground/40",
};

export const StatusBadge = ({ status }: { status: PrayerStatus }) => (
  <span
    className={`inline-flex items-center gap-1.5 font-accent text-[10px] uppercase tracking-[0.18em] border-b border-dotted pb-0.5 ${styles[status]}`}
  >
    <span className="inline-block w-1 h-1 rounded-full bg-current opacity-80" />
    {status}
  </span>
);
