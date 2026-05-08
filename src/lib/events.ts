import type { PrayerEvent } from "./prayer-types";
import { safeTime } from "./dates";

// "Maintenance" events are admin/housekeeping — duplicate creation events
// inherited from merged records, structural edits (rename, recategorize), and
// the merge audit entries themselves. The pastoral story
// (created → updates → status changes → resolutions) reads cleanly without
// them, so the default Timeline view hides them. They stay available behind
// the admin "Show full history" toggle for forensic audit.
export const isMaintenanceEvent = (
  event: PrayerEvent,
  allEvents: PrayerEvent[]
): boolean => {
  if (event.kind === "edited" || event.kind === "merged") return true;
  if (event.kind === "created") {
    const allCreated = allEvents.filter((e) => e.kind === "created");
    if (allCreated.length <= 1) return false;
    // Only the earliest `created` is pastoral — start of the journey. Later
    // ones came from merged records' original creation events and read as
    // duplicate noise.
    const earliest = allCreated.reduce((a, b) =>
      safeTime(a.at) <= safeTime(b.at) ? a : b
    );
    return event.id !== earliest.id;
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
