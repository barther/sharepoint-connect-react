import { describe, it, expect } from "vitest";
import { isMaintenanceEvent, splitEventsForDisplay } from "./events";
import type { PrayerEvent } from "./prayer-types";

const ev = (overrides: Partial<PrayerEvent>): PrayerEvent => ({
  id: 1,
  requestId: 1,
  kind: "note",
  at: "2026-01-01T00:00:00Z",
  by: "Test",
  ...overrides,
});

describe("isMaintenanceEvent", () => {
  it("treats note events as pastoral (never maintenance)", () => {
    const e = ev({ id: 1, kind: "note" });
    expect(isMaintenanceEvent(e, [e])).toBe(false);
  });

  it("treats status events as pastoral", () => {
    const e = ev({ id: 1, kind: "status", from: "Active", to: "Resolved" });
    expect(isMaintenanceEvent(e, [e])).toBe(false);
  });

  it("treats a content-free edited event as maintenance", () => {
    const e = ev({ id: 1, kind: "edited" });
    expect(isMaintenanceEvent(e, [e])).toBe(true);
  });

  it("treats an edited event with a substantive note as pastoral", () => {
    // Historical importers sometimes class real post-updates as `edited`.
    const e = ev({ id: 1, kind: "edited", note: "Surgery went well; recovering." });
    expect(isMaintenanceEvent(e, [e])).toBe(false);
  });

  it("surfaces a re-add `created` after the record was archived", () => {
    const original = ev({ id: 1, kind: "created", at: "2025-09-17T00:00:00Z" });
    const archived = ev({
      id: 2,
      kind: "status",
      at: "2025-11-26T00:00:00Z",
      from: "Active",
      to: "Archived",
    });
    const reAdded = ev({ id: 3, kind: "created", at: "2026-05-06T00:00:00Z" });
    const all = [original, archived, reAdded];
    expect(isMaintenanceEvent(reAdded, all)).toBe(false);
  });

  it("treats merged events as maintenance", () => {
    const e = ev({ id: 1, kind: "merged", note: "Merged from #2" });
    expect(isMaintenanceEvent(e, [e])).toBe(true);
  });

  it("treats a single created event as pastoral (start of journey)", () => {
    const e = ev({ id: 1, kind: "created" });
    expect(isMaintenanceEvent(e, [e])).toBe(false);
  });

  it("after a merge, only the earliest created event is pastoral", () => {
    const original = ev({ id: 1, kind: "created", at: "2024-09-15T00:00:00Z" });
    const fromMerge = ev({ id: 2, kind: "created", at: "2025-11-12T00:00:00Z" });
    const all = [original, fromMerge];
    expect(isMaintenanceEvent(original, all)).toBe(false);
    expect(isMaintenanceEvent(fromMerge, all)).toBe(true);
  });
});

describe("splitEventsForDisplay", () => {
  it("groups pastoral and maintenance events", () => {
    const events: PrayerEvent[] = [
      ev({ id: 1, kind: "created", at: "2024-09-15T00:00:00Z" }),
      ev({ id: 2, kind: "created", at: "2025-11-12T00:00:00Z" }),  // dup from merge
      ev({ id: 3, kind: "note", at: "2025-12-01T00:00:00Z" }),
      ev({ id: 4, kind: "edited", at: "2025-12-02T00:00:00Z" }),
      ev({ id: 5, kind: "status", at: "2026-01-15T00:00:00Z", from: "Active", to: "Resolved" }),
      ev({ id: 6, kind: "merged", at: "2026-05-07T00:00:00Z" }),
    ];
    const { pastoral, maintenance } = splitEventsForDisplay(events);
    expect(pastoral.map((e) => e.id)).toEqual([1, 3, 5]);
    expect(maintenance.map((e) => e.id)).toEqual([2, 4, 6]);
  });

  it("handles an all-pastoral sequence", () => {
    const events: PrayerEvent[] = [
      ev({ id: 1, kind: "created" }),
      ev({ id: 2, kind: "note" }),
      ev({ id: 3, kind: "status", from: "Active", to: "Ongoing" }),
    ];
    const { pastoral, maintenance } = splitEventsForDisplay(events);
    expect(pastoral).toHaveLength(3);
    expect(maintenance).toHaveLength(0);
  });

  it("handles an empty events list", () => {
    const { pastoral, maintenance } = splitEventsForDisplay([]);
    expect(pastoral).toEqual([]);
    expect(maintenance).toEqual([]);
  });
});
