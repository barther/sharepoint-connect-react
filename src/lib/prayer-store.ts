import { create } from "zustand";
import type { PrayerRequest, PrayerCategory, PrayerStatus } from "./prayer-types";

const seed: PrayerRequest[] = [
  {
    id: 1,
    title: "Margaret Ellison",
    request:
      "Continued strength through her recovery from hip surgery. She is home now and beginning physical therapy this week.",
    category: "Healing",
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
    category: "Grief",
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
    category: "Guidance",
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
    category: "Community",
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
    category: "Thanksgiving",
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
    category: "Healing",
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
    category: "Family",
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
    category: "Guidance",
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
    category: "Healing",
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
    category: "Community",
    status: "Archived",
    dateSubmitted: "2025-11-01",
    modified: "2026-01-15T10:00:00Z",
    created: "2025-11-01T09:00:00Z",
    author: "Pastor John",
  },
];

interface PrayerStore {
  items: PrayerRequest[];
  add: (
    p: Omit<PrayerRequest, "id" | "modified" | "created" | "author">
  ) => PrayerRequest;
  update: (id: number, patch: Partial<PrayerRequest>) => void;
  remove: (id: number) => void;
  setStatus: (id: number, status: PrayerStatus) => void;
}

export const usePrayerStore = create<PrayerStore>((set, get) => ({
  items: seed,
  add: (p) => {
    const now = new Date().toISOString();
    const id = Math.max(0, ...get().items.map((i) => i.id)) + 1;
    const item: PrayerRequest = {
      ...p,
      id,
      modified: now,
      created: now,
      author: "You",
    };
    set({ items: [item, ...get().items] });
    return item;
  },
  update: (id, patch) =>
    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, ...patch, modified: new Date().toISOString() } : i
      ),
    }),
  remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  setStatus: (id, status) =>
    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, status, modified: new Date().toISOString() } : i
      ),
    }),
}));

export type { PrayerRequest, PrayerCategory, PrayerStatus };
