import { create } from "zustand";
import {
  fetchRequests,
  fetchEvents,
  createRequest,
  patchRequest,
  deleteRequest,
  createEvent,
  patchEventRequestId,
} from "./graph";
import { safeTime } from "./dates";
import type {
  PrayerRequest,
  PrayerCategory,
  PrayerStatus,
  PrayerEvent,
} from "./prayer-types";

// ---------- Store ----------

interface PrayerStore {
  items: PrayerRequest[];
  events: PrayerEvent[];

  loaded: boolean;
  loading: boolean;
  error: string | null;

  // Identity of the current scribe — set from MSAL after sign-in.
  currentScribe: string;
  currentUpn: string | undefined;
  setIdentity: (name: string, upn?: string) => void;

  load: () => Promise<void>;

  add: (
    p: Omit<PrayerRequest, "id" | "modified" | "created" | "author">
  ) => Promise<PrayerRequest>;
  update: (
    id: number,
    patch: Partial<PrayerRequest>,
    opts?: { note?: string }
  ) => Promise<void>;
  remove: (id: number) => Promise<void>;
  setStatus: (id: number, status: PrayerStatus) => Promise<void>;
  addNote: (id: number, note: string) => Promise<void>;
  mergeInto: (canonicalId: number, duplicateId: number) => Promise<void>;

  eventsFor: (id: number) => PrayerEvent[];
}

export const usePrayerStore = create<PrayerStore>((set, get) => ({
  items: [],
  events: [],
  loaded: false,
  loading: false,
  error: null,
  currentScribe: "You",
  currentUpn: undefined,

  setIdentity: (name, upn) => set({ currentScribe: name, currentUpn: upn }),

  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const [items, events] = await Promise.all([fetchRequests(), fetchEvents()]);
      set({
        items: items.sort((a, b) => safeTime(b.created) - safeTime(a.created)),
        events,
        loaded: true,
        loading: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load list.";
      set({ loading: false, error: msg });
      throw e;
    }
  },

  add: async (p) => {
    const item = await createRequest(p);
    set({ items: [item, ...get().items] });

    // Best-effort audit row.
    try {
      const ev = await createEvent({
        requestId: item.id,
        kind: "created",
        byName: get().currentScribe,
        byUpn: get().currentUpn,
      });
      set({ events: [...get().events, ev] });
    } catch {
      /* non-fatal */
    }
    return item;
  },

  update: async (id, patch, opts) => {
    const before = get().items.find((i) => i.id === id);
    if (!before) return;

    await patchRequest(id, patch);
    const now = new Date().toISOString();
    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, ...patch, modified: now } : i
      ),
    });

    const newEvents: PrayerEvent[] = [];
    if (patch.status && patch.status !== before.status) {
      try {
        const ev = await createEvent({
          requestId: id,
          kind: "status",
          byName: get().currentScribe,
          byUpn: get().currentUpn,
          from: before.status,
          to: patch.status,
        });
        newEvents.push(ev);
      } catch {
        /* non-fatal */
      }
    }
    const textChanged =
      (patch.request !== undefined && patch.request !== before.request) ||
      (patch.title !== undefined && patch.title !== before.title) ||
      (patch.category !== undefined && patch.category !== before.category) ||
      (patch.relationship !== undefined && patch.relationship !== before.relationship) ||
      (patch.address !== undefined && patch.address !== before.address) ||
      (patch.notes !== undefined && patch.notes !== before.notes);
    if (textChanged) {
      try {
        const ev = await createEvent({
          requestId: id,
          kind: "edited",
          byName: get().currentScribe,
          byUpn: get().currentUpn,
          note: opts?.note,
        });
        newEvents.push(ev);
      } catch {
        /* non-fatal */
      }
    }
    if (newEvents.length) set({ events: [...get().events, ...newEvents] });
  },

  remove: async (id) => {
    await deleteRequest(id);
    set({
      items: get().items.filter((i) => i.id !== id),
      events: get().events.filter((e) => e.requestId !== id),
    });
  },

  setStatus: async (id, status) => {
    const before = get().items.find((i) => i.id === id);
    if (!before || before.status === status) return;

    // Optimistic — flip immediately so the UI feels instant, rollback if Graph rejects.
    const now = new Date().toISOString();
    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, status, modified: now } : i
      ),
    });

    try {
      await patchRequest(id, { status });
    } catch (e) {
      set({
        items: get().items.map((i) => (i.id === id ? before : i)),
      });
      throw e;
    }

    try {
      const ev = await createEvent({
        requestId: id,
        kind: "status",
        byName: get().currentScribe,
        byUpn: get().currentUpn,
        from: before.status,
        to: status,
      });
      set({ events: [...get().events, ev] });
    } catch {
      /* non-fatal */
    }
  },

  addNote: async (id, note) => {
    const trimmed = note.trim();
    if (!trimmed) return;
    const ev = await createEvent({
      requestId: id,
      kind: "note",
      byName: get().currentScribe,
      byUpn: get().currentUpn,
      note: trimmed,
    });
    // Promote the new entry to the request body — the headline always shows
    // the latest update, and the Wednesday bulletin (which reads `Request`)
    // gets the same text. patchRequest also bumps LastUpdated.
    try {
      await patchRequest(id, { request: trimmed });
    } catch {
      /* non-fatal — the audit event still landed */
    }
    const now = new Date().toISOString();
    set({
      events: [...get().events, ev],
      items: get().items.map((i) =>
        i.id === id ? { ...i, request: trimmed, modified: now } : i
      ),
    });
  },

  // Merge a duplicate record into a canonical one. Steps, in order:
  //   1. PATCH every PrayerEvents row whose RequestId points at the duplicate
  //      so it points at the canonical (preserves the full audit trail).
  //   2. If the duplicate was submitted earlier than the canonical, inherit
  //      that earlier dateSubmitted onto the canonical — the "on the list X"
  //      indicator should reflect the truer history.
  //   3. DELETE the duplicate's request item (its events are already moved).
  //   4. Append a `merged` event on the canonical so the merge itself is
  //      recorded in the timeline.
  //   5. Refresh local store from the same writes.
  // Destructive and irreversible — gated by `isAdminUpn` at the call site.
  mergeInto: async (canonicalId, duplicateId) => {
    if (canonicalId === duplicateId) {
      throw new Error("Can't merge a record into itself.");
    }
    const canonical = get().items.find((i) => i.id === canonicalId);
    const duplicate = get().items.find((i) => i.id === duplicateId);
    if (!canonical || !duplicate) {
      throw new Error("Could not find both records to merge.");
    }

    // 1. Reassign duplicate's events to canonical
    const dupEvents = get().events.filter((e) => e.requestId === duplicateId);
    await Promise.all(dupEvents.map((e) => patchEventRequestId(e.id, canonicalId)));

    // 2. Inherit earlier dateSubmitted if applicable
    let inheritedDateSubmitted: string | undefined;
    if (
      duplicate.dateSubmitted &&
      (!canonical.dateSubmitted || duplicate.dateSubmitted < canonical.dateSubmitted)
    ) {
      inheritedDateSubmitted = duplicate.dateSubmitted;
      await patchRequest(canonicalId, { dateSubmitted: duplicate.dateSubmitted });
    }

    // 3. Delete the duplicate
    await deleteRequest(duplicateId);

    // 4. Audit event on the canonical
    let mergedEvent: PrayerEvent | undefined;
    try {
      mergedEvent = await createEvent({
        requestId: canonicalId,
        kind: "merged",
        byName: get().currentScribe,
        byUpn: get().currentUpn,
        note: `Merged from "${duplicate.title}" (id #${duplicateId}) — ${dupEvents.length} event${dupEvents.length === 1 ? "" : "s"} preserved.`,
      });
    } catch {
      /* non-fatal — the merge itself succeeded, audit row missed */
    }

    // 5. Reflect in local store
    const now = new Date().toISOString();
    set({
      items: get()
        .items.filter((i) => i.id !== duplicateId)
        .map((i) =>
          i.id === canonicalId
            ? {
                ...i,
                dateSubmitted: inheritedDateSubmitted ?? i.dateSubmitted,
                modified: now,
              }
            : i
        ),
      events: [
        ...get().events.map((e) =>
          e.requestId === duplicateId ? { ...e, requestId: canonicalId } : e
        ),
        ...(mergedEvent ? [mergedEvent] : []),
      ],
    });
  },

  eventsFor: (id) =>
    get()
      .events.filter((e) => e.requestId === id)
      .sort((a, b) => safeTime(b.at) - safeTime(a.at)),
}));

export type { PrayerRequest, PrayerCategory, PrayerStatus };
