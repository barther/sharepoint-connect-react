import type { PrayerEvent } from "./prayer-types";
import { safeTime } from "./dates";

// "Maintenance" events are admin/housekeeping — duplicate creation events
// from same-day merges, content-free structural edits, and merge audit
// entries. The pastoral story (created → updates → status changes →
// resolutions → re-adds) reads cleanly without them, so the default Timeline
// view hides them. They stay available behind the admin "Show full history"
// toggle for forensic audit.
export const isMaintenanceEvent = (
  event: PrayerEvent,
  allEvents: PrayerEvent[]
): boolean => {
  if (event.kind === "merged") return true;

  // An `edited` event with a substantive note is a real narrative update
  // (historical importers often class post-updates this way). Empty edits —
  // typo fix, recategorization with no commentary — stay as maintenance.
  if (event.kind === "edited") {
    return !event.note || event.note.trim() === "";
  }

  if (event.kind === "created") {
    const allCreated = allEvents.filter((e) => e.kind === "created");
    if (allCreated.length <= 1) return false;
    // The earliest `created` always survives — it's the start of the journey.
    const earliest = allCreated.reduce((a, b) =>
      safeTime(a.at) <= safeTime(b.at) ? a : b
    );
    if (event.id === earliest.id) return false;
    // A later `created` is pastoral if it represents a re-addition after the
    // record was archived/resolved (a real chapter marker). Same-day
    // duplicates from a merge have no intervening status change and stay
    // hidden as noise.
    const at = safeTime(event.at);
    const cameOffList = allEvents.some(
      (e) =>
        e.kind === "status" &&
        (e.to === "Archived" || e.to === "Resolved") &&
        safeTime(e.at) < at
    );
    return !cameOffList;
  }

  return false;
};

export const splitEventsForDisplay = (events: PrayerEvent[]) => {
  const pastoral: PrayerEvent[] = [];
  const maintenance: PrayerEvent[] = [];
  for (const e of events) {
    (isMaintenanceEvent(e, events) ? maintenance : pastoral).push(e);
  }
  return { pastoral, maintenance };
};
