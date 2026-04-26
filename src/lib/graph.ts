// Thin Microsoft Graph client for the Prayer List SharePoint lists.
// Schema reference: mem://sharepoint/schema.md
import { acquireGraphToken } from "./msal";
import { msalInstance } from "./msal";
import type {
  PrayerRequest,
  PrayerEvent,
  PrayerEventKind,
  PrayerStatus,
  PrayerCategory,
} from "./prayer-types";

export const SITE_ID =
  "lithiaspringsmethodist.sharepoint.com,3425ccd5-677f-413a-8a5e-0c2795a67220,4f0c6b8d-e50f-4079-89ad-14107c71ca83";
export const REQUESTS_LIST_ID = "176cec8e-c1a6-4319-a90a-e048ef4f19cf";
export const EVENTS_LIST_ID = "4140d627-0b20-482d-be5c-3cd3fa85ca14";

const GRAPH = "https://graph.microsoft.com/v1.0";

function toIsoDate(input?: string): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

async function token(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) throw new Error("Not signed in");
  return acquireGraphToken(account);
}

async function gfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const t = await token();
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Prayer Requests list ----------

interface RequestFields {
  Title?: string;
  Request?: string;
  Category?: PrayerCategory;
  Status?: PrayerStatus;
  Relationship?: string;
  DateSubmitted?: string; // ISO
  Address?: string;
  Notes?: string;
  // App-controlled "last touched" timestamp. Distinct from SharePoint's system
  // `Modified`, which gets bumped by imports/bulk operations and lies about
  // when a scribe actually edited. We always set this on writes so it tracks
  // the real edit time end-to-end.
  LastUpdated?: string;
}

interface ListItem<F> {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  createdBy?: { user?: { displayName?: string; email?: string } };
  fields: F & { id: string };
}

interface ListItemsResponse<F> {
  value: ListItem<F>[];
  "@odata.nextLink"?: string;
}

function rowToRequest(item: ListItem<RequestFields>): PrayerRequest {
  const f = item.fields;
  return {
    id: Number(item.id),
    title: f.Title ?? "(untitled)",
    request: f.Request ?? "",
    category: (f.Category ?? "Member") as PrayerCategory,
    status: (f.Status ?? "Active") as PrayerStatus,
    relationship: f.Relationship || undefined,
    // `||` (not `??`) so empty strings fall through to createdDateTime —
    // SharePoint can return "" for blank Date columns and `??` skips that.
    dateSubmitted: (f.DateSubmitted || item.createdDateTime || "").slice(0, 10),
    address: f.Address || undefined,
    notes: f.Notes || undefined,
    // Truth-prioritized fallback chain:
    //   1. LastUpdated — set by every app write, the real "last touched"
    //   2. DateSubmitted — for historical imports without LastUpdated, this is
    //      at least an honest floor ("hasn't been touched in app since at least
    //      it was first listed"). Better than the system Modified field, which
    //      bulk imports bump to "now" and lie about activity.
    //   3. createdDateTime — last-resort fallback if both are blank.
    modified: f.LastUpdated || f.DateSubmitted || item.createdDateTime,
    created: item.createdDateTime,
    author: item.createdBy?.user?.displayName ?? "Unknown",
  };
}

export async function fetchRequests(): Promise<PrayerRequest[]> {
  const all: ListItem<RequestFields>[] = [];
  let url: string | undefined =
    `/sites/${SITE_ID}/lists/${REQUESTS_LIST_ID}/items?expand=fields&$top=200`;
  while (url) {
    const page = await gfetch<ListItemsResponse<RequestFields>>(url);
    all.push(...page.value);
    const next = page["@odata.nextLink"];
    url = next ? next.replace(GRAPH, "") : undefined;
  }
  return all.map(rowToRequest);
}

export async function createRequest(
  p: Omit<PrayerRequest, "id" | "modified" | "created" | "author">
): Promise<PrayerRequest> {
  const fields: RequestFields = {
    Title: p.title,
    Request: p.request,
    Category: p.category,
    Status: p.status,
    Relationship: p.relationship,
    DateSubmitted: toIsoDate(p.dateSubmitted),
    Address: p.address,
    Notes: p.notes,
    LastUpdated: new Date().toISOString(),
  };
  const created = await gfetch<ListItem<RequestFields>>(
    `/sites/${SITE_ID}/lists/${REQUESTS_LIST_ID}/items?expand=fields`,
    { method: "POST", body: JSON.stringify({ fields }) }
  );
  return rowToRequest(created);
}

export async function patchRequest(
  id: number,
  patch: Partial<PrayerRequest>
): Promise<void> {
  // Always bump LastUpdated so any write (status flip, edit, note-attached
  // touch) sets a fresh "modified" the app can trust.
  const fields: RequestFields = { LastUpdated: new Date().toISOString() };
  if (patch.title !== undefined) fields.Title = patch.title;
  if (patch.request !== undefined) fields.Request = patch.request;
  if (patch.category !== undefined) fields.Category = patch.category;
  if (patch.status !== undefined) fields.Status = patch.status;
  if (patch.relationship !== undefined) fields.Relationship = patch.relationship;
  if (patch.dateSubmitted !== undefined) {
    fields.DateSubmitted = toIsoDate(patch.dateSubmitted);
  }
  if (patch.address !== undefined) fields.Address = patch.address;
  if (patch.notes !== undefined) fields.Notes = patch.notes;

  await gfetch(
    `/sites/${SITE_ID}/lists/${REQUESTS_LIST_ID}/items/${id}/fields`,
    { method: "PATCH", body: JSON.stringify(fields) }
  );
}

export async function deleteRequest(id: number): Promise<void> {
  await gfetch(`/sites/${SITE_ID}/lists/${REQUESTS_LIST_ID}/items/${id}`, {
    method: "DELETE",
  });
}

// ---------- PrayerEvents list ----------

interface EventFields {
  Title?: string;
  RequestId?: number;
  Kind?: PrayerEventKind;
  At?: string;
  ByName?: string;
  ByUpn?: string;
  FromValue?: string;
  ToValue?: string;
  NoteText?: string;
}

function rowToEvent(item: ListItem<EventFields>): PrayerEvent {
  const f = item.fields;
  return {
    id: Number(item.id),
    requestId: Number(f.RequestId ?? 0),
    kind: (f.Kind ?? "edited") as PrayerEventKind,
    at: f.At ?? item.createdDateTime,
    by: f.ByName ?? item.createdBy?.user?.displayName ?? "Unknown",
    from: f.FromValue || undefined,
    to: f.ToValue || undefined,
    note: f.NoteText || undefined,
  };
}

export async function fetchEvents(): Promise<PrayerEvent[]> {
  const all: ListItem<EventFields>[] = [];
  let url: string | undefined =
    `/sites/${SITE_ID}/lists/${EVENTS_LIST_ID}/items?expand=fields&$top=500`;
  while (url) {
    const page = await gfetch<ListItemsResponse<EventFields>>(url);
    all.push(...page.value);
    const next = page["@odata.nextLink"];
    url = next ? next.replace(GRAPH, "") : undefined;
  }
  return all.map(rowToEvent);
}

export interface NewEventInput {
  requestId: number;
  kind: PrayerEventKind;
  byName: string;
  byUpn?: string;
  from?: string;
  to?: string;
  note?: string;
  title?: string;
}

export async function createEvent(input: NewEventInput): Promise<PrayerEvent> {
  const titleFallback: Record<PrayerEventKind, string> = {
    created: "Created",
    status: `Status: ${input.from ?? "?"} → ${input.to ?? "?"}`,
    edited: "Edited",
    note: "Note added",
  };
  const fields: EventFields = {
    Title: input.title ?? titleFallback[input.kind],
    RequestId: input.requestId,
    Kind: input.kind,
    At: new Date().toISOString(),
    ByName: input.byName,
    ByUpn: input.byUpn,
    FromValue: input.from,
    ToValue: input.to,
    NoteText: input.note,
  };
  const created = await gfetch<ListItem<EventFields>>(
    `/sites/${SITE_ID}/lists/${EVENTS_LIST_ID}/items?expand=fields`,
    { method: "POST", body: JSON.stringify({ fields }) }
  );
  return rowToEvent(created);
}

// ---------- Weekly bulletin (Power Automate output) ----------

// The Wednesday-1:30pm flow drops PDFs in `/Prayer List Archive/` named
// `prayer_list_YYYYMMDD.pdf`. Sorting by name desc = sorting by print-date desc,
// which is more reliable than sorting by modified time (a bulk-archive cleanup
// could touch modified without actually being a new bulletin).
export interface BulletinFile {
  name: string;
  webUrl: string;
  lastModifiedDateTime: string;
  /** ISO date parsed from the filename (`YYYY-MM-DD`), or null if unparseable. */
  printedOn: string | null;
}

const BULLETIN_NAME = "Prayer List Archive";

const parsePrintedOn = (filename: string): string | null => {
  const m = filename.match(/prayer_list_(\d{4})(\d{2})(\d{2})\.pdf/i);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

interface DriveItem {
  name: string;
  webUrl: string;
  lastModifiedDateTime: string;
  file?: { mimeType: string };
}

const toBulletin = (pdf: DriveItem): BulletinFile => ({
  name: pdf.name,
  webUrl: pdf.webUrl,
  lastModifiedDateTime: pdf.lastModifiedDateTime,
  printedOn: parsePrintedOn(pdf.name),
});

const pickLatestPdf = (items: DriveItem[]): DriveItem | undefined =>
  // Filter to PDFs first, then prefer name-desc sort (filename embeds the
  // print date). Fall back to lastModified if names don't match the pattern.
  items
    .filter((f) => /\.pdf$/i.test(f.name))
    .sort((a, b) => {
      const ad = parsePrintedOn(a.name);
      const bd = parsePrintedOn(b.name);
      if (ad && bd) return bd.localeCompare(ad);
      return b.lastModifiedDateTime.localeCompare(a.lastModifiedDateTime);
    })[0];

export async function fetchLatestBulletin(): Promise<BulletinFile | null> {
  const query = new URLSearchParams({ "$top": "25" }).toString();

  // Strategy 1: a sibling document library called "Prayer List Archive".
  // The Power Automate `folderPath: "/Prayer List Archive"` syntax usually
  // points at a library at site root, not a folder in the default library.
  try {
    const drives = await gfetch<{ value: { id: string; name: string }[] }>(
      `/sites/${SITE_ID}/drives`
    );
    const lib = drives.value.find(
      (d) => d.name.toLowerCase() === BULLETIN_NAME.toLowerCase()
    );
    if (lib) {
      const res = await gfetch<{ value: DriveItem[] }>(
        `/drives/${lib.id}/root/children?${query}`
      );
      const pdf = pickLatestPdf(res.value);
      if (pdf) return toBulletin(pdf);
    }
  } catch (e) {
    console.warn("[bulletin] library lookup failed:", e);
  }

  // Strategy 2: a folder named "Prayer List Archive" inside the default
  // Documents library.
  try {
    const folder = encodeURIComponent(BULLETIN_NAME);
    const res = await gfetch<{ value: DriveItem[] }>(
      `/sites/${SITE_ID}/drive/root:/${folder}:/children?${query}`
    );
    const pdf = pickLatestPdf(res.value);
    if (pdf) return toBulletin(pdf);
  } catch (e) {
    console.warn("[bulletin] folder lookup failed:", e);
  }

  console.warn(
    "[bulletin] no PDF found in '%s' as either a library or a folder. " +
      "Check where Power Automate is actually saving the file.",
    BULLETIN_NAME
  );
  return null;
}
