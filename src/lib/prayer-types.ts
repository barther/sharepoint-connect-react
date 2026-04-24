// Types matching the SharePoint "Prayer Requests" list schema from PrayerList_final.msapp
export type PrayerStatus = "Active" | "Ongoing" | "Resolved" | "Archived";

export type PrayerCategory =
  | "Healing"
  | "Family"
  | "Grief"
  | "Thanksgiving"
  | "Guidance"
  | "Community"
  | "Other";

export interface PrayerRequest {
  id: number;
  title: string;
  request: string;
  category: PrayerCategory;
  status: PrayerStatus;
  relationship?: string;
  dateSubmitted: string; // ISO date
  address?: string;
  notes?: string;
  modified: string; // ISO datetime
  created: string; // ISO datetime
  author: string;
}

// Audit trail — one row per change. In SharePoint this maps to either a
// child "PrayerEvents" list or a parsed version-history feed from Graph.
export type PrayerEventKind =
  | "created"
  | "status"        // status change
  | "edited"        // text/category/etc edited
  | "note";         // free-form pastoral note

export interface PrayerEvent {
  id: number;
  requestId: number;
  kind: PrayerEventKind;
  at: string;          // ISO datetime
  by: string;          // person who made the change
  // Optional payload — kept loose so we can render nicely without a switch tree
  from?: string;
  to?: string;
  note?: string;
}

// Frozen weekly snapshot — what the printed sheet looked like that Wednesday.
// In SharePoint this maps to a "WeeklySnapshots" list with a JSON payload column.
export interface WeeklySnapshot {
  id: string;          // e.g. "2026-W17"
  printedOn: string;   // ISO datetime
  printedBy: string;
  isoYear: number;
  isoWeek: number;
  // We snapshot the request rows we care about printing — a literal photograph.
  items: Array<Pick<
    PrayerRequest,
    "id" | "title" | "request" | "category" | "status" | "relationship" | "dateSubmitted"
  >>;
}

export const STATUSES: PrayerStatus[] = ["Active", "Ongoing", "Resolved", "Archived"];
export const CATEGORIES: PrayerCategory[] = [
  "Healing",
  "Family",
  "Grief",
  "Thanksgiving",
  "Guidance",
  "Community",
  "Other",
];
