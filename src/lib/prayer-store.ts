import { create } from "zustand";
import type {
  PrayerRequest,
  PrayerCategory,
  PrayerStatus,
  PrayerEvent,
  PrayerEventKind,
} from "./prayer-types";

// ---------- Seed data ----------

const seed: PrayerRequest[] = [
  {
    id: 1,
    title: "Margaret Ellison",
    request:
      "Continued strength through her recovery from hip surgery. She is home now and beginning physical therapy this week.",
    category: "Member",
    status: "Active",
    relationship: "Member, Choir",
    dateSubmitted: "2026-04-20",
    notes: "Family appreciates meals on Tuesdays and Thursdays.",
    modified: "2026-04-22T14:10:00Z",
    created: "2026-04-20T09:00:00Z",
    author: "Pastor John",
  },
  {
    id: 2,
    title: "The Wheeler Family",
    request:
      "Comfort and peace following the passing of Tom Wheeler. Pray especially for Susan and the grandchildren as they prepare for the service this Saturday.",
    category: "Family or Friend",
    status: "Active",
    relationship: "Family of member",
    dateSubmitted: "2026-04-18",
    modified: "2026-04-21T18:00:00Z",
    created: "2026-04-18T11:00:00Z",
    author: "Linda M.",
  },
  {
    id: 3,
    title: "James Okafor",
    request: "Discernment as he considers a call to seminary.",
    category: "Member",
    status: "Ongoing",
    relationship: "Youth group",
    dateSubmitted: "2026-03-02",
    modified: "2026-04-15T08:30:00Z",
    created: "2026-03-02T10:00:00Z",
    author: "Pastor John",
  },
  {
    id: 4,
    title: "Our Wednesday food pantry",
    request:
      "For the volunteers, the families we serve, and continued generosity from the congregation through the spring.",
    category: "Nation or World",
    status: "Ongoing",
    dateSubmitted: "2026-01-10",
    modified: "2026-04-10T12:00:00Z",
    created: "2026-01-10T09:00:00Z",
    author: "Deacon Ruth",
  },
  {
    id: 5,
    title: "Baby Eleanor Hayes",
    request: "Thanksgiving for her safe arrival on Easter morning. Mother and baby both doing well.",
    category: "Member",
    status: "Active",
    relationship: "Member family",
    dateSubmitted: "2026-04-05",
    modified: "2026-04-19T15:00:00Z",
    created: "2026-04-05T08:00:00Z",
    author: "Pastor John",
  },
  {
    id: 6,
    title: "David Chen",
    request: "Healing from pneumonia; he is responding well to treatment and was moved out of the ICU yesterday.",
    category: "Family or Friend",
    status: "Active",
    relationship: "Visitor",
    dateSubmitted: "2026-04-15",
    modified: "2026-04-22T09:00:00Z",
    created: "2026-04-15T16:00:00Z",
    author: "Linda M.",
  },
  {
    id: 7,
    title: "The Patel family",
    request: "Safe travel as they visit relatives overseas this month.",
    category: "Member",
    status: "Active",
    dateSubmitted: "2026-04-12",
    modified: "2026-04-12T10:00:00Z",
    created: "2026-04-12T10:00:00Z",
    author: "Pastor John",
  },
  {
    id: 8,
    title: "Robert Mason",
    request: "Strength and clarity as he begins a new chapter of work after retirement.",
    category: "Member",
    status: "Resolved",
    dateSubmitted: "2026-02-01",
    modified: "2026-03-30T11:00:00Z",
    created: "2026-02-01T09:00:00Z",
    author: "Pastor John",
  },
  {
    id: 9,
    title: "Anna Bauer",
    request: "Recovery from knee surgery — back to walking with the morning group.",
    category: "Member",
    status: "Resolved",
    dateSubmitted: "2026-01-15",
    modified: "2026-03-01T08:00:00Z",
    created: "2026-01-15T09:00:00Z",
    author: "Linda M.",
  },
  {
    id: 10,
    title: "Spring mission trip",
    request: "Safe return of the youth team and continued fruit from the relationships built.",
    category: "Nation or World",
    status: "Archived",
    dateSubmitted: "2025-11-01",
    modified: "2026-01-15T10:00:00Z",
    created: "2025-11-01T09:00:00Z",
    author: "Pastor John",
  },
];

// Seed events derived from the seed data so the timeline isn't empty on first load.
const seedEvents: PrayerEvent[] = [
  // Margaret — created, then a status touch later
  { id: 1, requestId: 1, kind: "created", at: "2026-04-20T09:00:00Z", by: "Pastor John" },
  { id: 2, requestId: 1, kind: "edited", at: "2026-04-22T14:10:00Z", by: "Linda M.", note: "Updated request — she's home from hospital." },

  { id: 3, requestId: 2, kind: "created", at: "2026-04-18T11:00:00Z", by: "Linda M." },
  { id: 4, requestId: 2, kind: "note", at: "2026-04-21T18:00:00Z", by: "Pastor John", note: "Service set for Saturday at 11am. Susan asked for cards mailed to home address." },

  { id: 5, requestId: 3, kind: "created", at: "2026-03-02T10:00:00Z", by: "Pastor John" },
  { id: 6, requestId: 3, kind: "status", at: "2026-03-23T19:00:00Z", by: "Pastor John", from: "Active", to: "Ongoing" },
  { id: 7, requestId: 3, kind: "edited", at: "2026-04-15T08:30:00Z", by: "Pastor John", note: "Application submitted to Candler." },

  { id: 8, requestId: 4, kind: "created", at: "2026-01-10T09:00:00Z", by: "Deacon Ruth" },
  { id: 9, requestId: 4, kind: "status", at: "2026-02-01T19:00:00Z", by: "Deacon Ruth", from: "Active", to: "Ongoing" },

  { id: 10, requestId: 5, kind: "created", at: "2026-04-05T08:00:00Z", by: "Pastor John" },

  { id: 11, requestId: 6, kind: "created", at: "2026-04-15T16:00:00Z", by: "Linda M." },
  { id: 12, requestId: 6, kind: "edited", at: "2026-04-22T09:00:00Z", by: "Linda M.", note: "Out of ICU, moved to step-down unit." },

  { id: 13, requestId: 7, kind: "created", at: "2026-04-12T10:00:00Z", by: "Pastor John" },

  { id: 14, requestId: 8, kind: "created", at: "2026-02-01T09:00:00Z", by: "Pastor John" },
  { id: 15, requestId: 8, kind: "status", at: "2026-03-30T11:00:00Z", by: "Pastor John", from: "Active", to: "Resolved" },

  { id: 16, requestId: 9, kind: "created", at: "2026-01-15T09:00:00Z", by: "Linda M." },
  { id: 17, requestId: 9, kind: "status", at: "2026-03-01T08:00:00Z", by: "Linda M.", from: "Active", to: "Resolved" },

  { id: 18, requestId: 10, kind: "created", at: "2025-11-01T09:00:00Z", by: "Pastor John" },
  { id: 19, requestId: 10, kind: "status", at: "2026-01-15T10:00:00Z", by: "Pastor John", from: "Active", to: "Archived" },
];

// A couple seed snapshots so the "Past Wednesdays" list isn't empty.
const snapshotItems = (items: PrayerRequest[]) =>
  items
    .filter((i) => i.status === "Active" || i.status === "Ongoing")
    .map(({ id, title, request, category, status, relationship, dateSubmitted }) => ({
      id, title, request, category, status, relationship, dateSubmitted,
    }));

const seedSnapshots: WeeklySnapshot[] = [
  {
    id: "2026-W16",
    printedOn: "2026-04-15T07:30:00Z",
    printedBy: "Linda M.",
    isoYear: 2026,
    isoWeek: 16,
    items: snapshotItems(seed).slice(0, 6),
  },
  {
    id: "2026-W15",
    printedOn: "2026-04-08T07:25:00Z",
    printedBy: "Linda M.",
    isoYear: 2026,
    isoWeek: 15,
    items: snapshotItems(seed).slice(0, 5),
  },
];

// ---------- Store ----------

interface PrayerStore {
  items: PrayerRequest[];
  events: PrayerEvent[];
  snapshots: WeeklySnapshot[];

  // Identity of the current scribe — replaced by MSAL claims later.
  currentScribe: string;

  add: (
    p: Omit<PrayerRequest, "id" | "modified" | "created" | "author">
  ) => PrayerRequest;
  update: (id: number, patch: Partial<PrayerRequest>, opts?: { note?: string }) => void;
  remove: (id: number) => void;
  setStatus: (id: number, status: PrayerStatus) => void;
  addNote: (id: number, note: string) => void;

  eventsFor: (id: number) => PrayerEvent[];

  takeSnapshot: () => WeeklySnapshot;
  snapshotFor: (key: string) => WeeklySnapshot | undefined;
}

const nextId = (xs: { id: number }[]) =>
  Math.max(0, ...xs.map((x) => x.id)) + 1;

export const usePrayerStore = create<PrayerStore>((set, get) => ({
  items: seed,
  events: seedEvents,
  snapshots: seedSnapshots,
  currentScribe: "You",

  add: (p) => {
    const now = new Date().toISOString();
    const item: PrayerRequest = {
      ...p,
      id: nextId(get().items),
      modified: now,
      created: now,
      author: get().currentScribe,
    };
    const event: PrayerEvent = {
      id: nextId(get().events),
      requestId: item.id,
      kind: "created",
      at: now,
      by: get().currentScribe,
    };
    set({ items: [item, ...get().items], events: [...get().events, event] });
    return item;
  },

  update: (id, patch, opts) => {
    const now = new Date().toISOString();
    const before = get().items.find((i) => i.id === id);
    if (!before) return;

    const newEvents: PrayerEvent[] = [];
    if (patch.status && patch.status !== before.status) {
      newEvents.push({
        id: nextId([...get().events, ...newEvents]),
        requestId: id,
        kind: "status",
        at: now,
        by: get().currentScribe,
        from: before.status,
        to: patch.status,
      });
    }
    // Treat any edit to text/category/etc as a generic "edited" event.
    const textChanged =
      (patch.request !== undefined && patch.request !== before.request) ||
      (patch.title !== undefined && patch.title !== before.title) ||
      (patch.category !== undefined && patch.category !== before.category) ||
      (patch.relationship !== undefined && patch.relationship !== before.relationship) ||
      (patch.address !== undefined && patch.address !== before.address);
    if (textChanged) {
      newEvents.push({
        id: nextId([...get().events, ...newEvents]),
        requestId: id,
        kind: "edited",
        at: now,
        by: get().currentScribe,
        note: opts?.note,
      });
    }

    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, ...patch, modified: now } : i
      ),
      events: [...get().events, ...newEvents],
    });
  },

  remove: (id) =>
    set({
      items: get().items.filter((i) => i.id !== id),
      events: get().events.filter((e) => e.requestId !== id),
    }),

  setStatus: (id, status) => {
    const before = get().items.find((i) => i.id === id);
    if (!before || before.status === status) return;
    const now = new Date().toISOString();
    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, status, modified: now } : i
      ),
      events: [
        ...get().events,
        {
          id: nextId(get().events),
          requestId: id,
          kind: "status",
          at: now,
          by: get().currentScribe,
          from: before.status,
          to: status,
        },
      ],
    });
  },

  addNote: (id, note) => {
    if (!note.trim()) return;
    const now = new Date().toISOString();
    set({
      events: [
        ...get().events,
        {
          id: nextId(get().events),
          requestId: id,
          kind: "note",
          at: now,
          by: get().currentScribe,
          note: note.trim(),
        },
      ],
      items: get().items.map((i) =>
        i.id === id ? { ...i, modified: now } : i
      ),
    });
  },

  eventsFor: (id) =>
    get()
      .events.filter((e) => e.requestId === id)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at)),

  takeSnapshot: () => {
    const now = new Date();
    const { year, week, key } = isoWeekOf(now);
    const existing = get().snapshots.find((s) => s.id === key);
    const snap: WeeklySnapshot = {
      id: key,
      printedOn: now.toISOString(),
      printedBy: get().currentScribe,
      isoYear: year,
      isoWeek: week,
      items: snapshotItems(get().items),
    };
    set({
      snapshots: existing
        ? get().snapshots.map((s) => (s.id === key ? snap : s))
        : [snap, ...get().snapshots],
    });
    return snap;
  },

  snapshotFor: (key) => get().snapshots.find((s) => s.id === key),
}));

export type { PrayerRequest, PrayerCategory, PrayerStatus };
