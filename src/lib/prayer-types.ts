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
