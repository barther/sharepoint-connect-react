import { format, formatDistanceToNow } from "date-fns";
import type { PrayerEvent } from "@/lib/prayer-types";

const kindLabel = (e: PrayerEvent): string => {
  switch (e.kind) {
    case "created": return "Added to the list";
    case "status":  return `Marked ${e.to}`;
    case "edited":  return "Updated";
    case "note":    return "Note added";
  }
};

export const Timeline = ({ events }: { events: PrayerEvent[] }) => {
  if (events.length === 0) {
    return (
      <p className="font-accent italic text-muted-foreground text-base">
        Nothing recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-foreground/20 ml-2 sm:ml-3 space-y-6">
      {events.map((e) => (
        <li key={e.id} className="pl-5 sm:pl-6 relative">
          {/* dot */}
          <span
            aria-hidden
            className="absolute -left-[5px] top-2 w-[9px] h-[9px] rounded-full bg-primary"
          />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-lg leading-tight text-foreground">
              {kindLabel(e)}
              {e.kind === "status" && e.from && (
                <span className="font-accent text-sm text-muted-foreground italic ml-2">
                  (was {e.from})
                </span>
              )}
            </span>
          </div>
          <p className="font-accent text-sm text-muted-foreground tabular-nums mt-0.5">
            {format(new Date(e.at), "MMM d, yyyy · h:mm a")}
            <span className="mx-1.5">·</span>
            {e.by}
            <span className="mx-1.5">·</span>
            <span className="italic">
              {formatDistanceToNow(new Date(e.at), { addSuffix: true })}
            </span>
          </p>
          {e.note && (
            <p className="mt-2 font-body text-foreground/85 leading-relaxed text-base sm:text-lg">
              {e.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
};
