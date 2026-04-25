import { create } from "zustand";
import {
  fetchRequests,
  fetchEvents,
  createRequest,
  patchRequest,
  deleteRequest,
  createEvent,
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
    if (!note.trim()) return;
    const ev = await createEvent({
      requestId: id,
      kind: "note",
      byName: get().currentScribe,
      byUpn: get().currentUpn,
      note: note.trim(),
    });
    // Bump the request's LastUpdated so adding a note counts as activity for
    // staleness/sort. patchRequest sets LastUpdated unconditionally even with
    // an empty patch.
    try {
      await patchRequest(id, {});
    } catch {
      /* non-fatal — the audit event still landed */
    }
    const now = new Date().toISOString();
    set({
      events: [...get().events, ev],
      items: get().items.map((i) =>
        i.id === id ? { ...i, modified: now } : i
      ),
    });
  },

  eventsFor: (id) =>
    get()
      .events.filter((e) => e.requestId === id)
      .sort((a, b) => safeTime(b.at) - safeTime(a.at)),
}));

export type { PrayerRequest, PrayerCategory, PrayerStatus };
