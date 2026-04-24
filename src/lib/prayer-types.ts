// Types matching the SharePoint "Prayer Requests" list schema from PrayerList_final.msapp
export type PrayerStatus = "Active" | "Ongoing" | "Resolved" | "Archived";

// Categories are RELATIONAL (not topical) and match the SharePoint
// "Prayer Requests" list Category choice column exactly.
export type PrayerCategory =
  | "Member"
  | "Family or Friend"
  | "Text-in request"
  | "Homebound member"
  | "Nation or World";

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

export const STATUSES: PrayerStatus[] = ["Active", "Ongoing", "Resolved", "Archived"];
export const CATEGORIES: PrayerCategory[] = [
  "Member",
  "Family or Friend",
  "Text-in request",
  "Homebound member",
  "Nation or World",
];
