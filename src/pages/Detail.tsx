import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Masthead } from "@/components/Masthead";
import { safeFormat, safeTime } from "@/lib/dates";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { usePrayerStore } from "@/lib/prayer-store";
import { toast } from "sonner";

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = usePrayerStore((s) => s.items.find((i) => i.id === Number(id)));
  // Subscribe to the raw events array — `.filter()` inside a selector returns a
  // new reference every render, which Zustand reads as a state change and loops
  // (React error #185).
  const allEvents = usePrayerStore((s) => s.events);
  const loaded = usePrayerStore((s) => s.loaded);
  const loading = usePrayerStore((s) => s.loading);
  const setStatus = usePrayerStore((s) => s.setStatus);
  const remove = usePrayerStore((s) => s.remove);
  const addNote = usePrayerStore((s) => s.addNote);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const sortedEvents = useMemo(() => {
    if (!item) return [];
    return allEvents
      .filter((e) => e.requestId === item.id)
      .sort((a, b) => safeTime(b.at) - safeTime(a.at));
  }, [allEvents, item]);

  if (!item) {
    const stillLoading = !loaded && loading;
    return (
      <div className="min-h-screen">
        <Masthead />
        <div className="container-prose py-24 text-center">
          <p className="text-2xl font-semibold">
            {stillLoading ? "Loading the list…" : "This request could not be found."}
          </p>
          {!stillLoading && (
            <Link to="/" className="text-primary mt-4 inline-block text-lg font-medium">
              ← Return to the list
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isInactive = item.status === "Resolved" || item.status === "Archived";
  const backTo = isInactive ? "/archive" : "/";

  const onAddNote = async () => {
    if (!noteDraft.trim()) return;
    try {
      await addNote(item.id, noteDraft);
      setNoteDraft("");
      toast.success("Update posted.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save update.");
    }
  };

  const doStatus = async (next: typeof item.status, msg: string, after?: () => void) => {
    try {
      await setStatus(item.id, next);
      toast.success(msg);
      after?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update status.");
    }
  };

  return (
    <div className="min-h-screen">
      <Masthead />

      <article className="container-prose py-6 sm:py-10">
        <Link
          to={backTo}
          className="text-base text-foreground/80 hover:text-primary inline-flex items-center gap-2 min-h-[44px] font-medium"
        >
          <span aria-hidden className="text-xl">←</span> Back to the list
        </Link>

        <header className="mt-4 pb-6 border-b border-foreground/15">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
            <StatusBadge status={item.status} />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              {item.category}
            </span>
          </div>
          <h1 className="font-display">{item.title}</h1>
          {item.relationship && (
            <p className="text-muted-foreground mt-2 text-lg">{item.relationship}</p>
          )}
          <p className="text-sm text-muted-foreground mt-3 tabular-nums">
            Submitted {safeFormat(item.dateSubmitted, "MMMM d, yyyy", "an unknown date")}
            <span className="hidden sm:inline"> · by {item.author}</span>
            <span className="sm:hidden block">by {item.author}</span>
          </p>
        </header>

        <div className="mt-6">
          <p className="text-lg sm:text-xl leading-[1.6] text-foreground">
            {item.request}
          </p>
        </div>

        {item.notes && (
          <section className="mt-8 bg-card border border-foreground/15 rounded-lg p-4 sm:p-5">
            <h3 className="eyebrow mb-2">Pastoral notes</h3>
            <p className="text-foreground/90 leading-relaxed text-base sm:text-lg">{item.notes}</p>
          </section>
        )}

        {item.address && (
          <section className="mt-6">
            <h3 className="eyebrow mb-2">Address</h3>
            <p className="text-foreground/85 whitespace-pre-line text-base sm:text-lg">{item.address}</p>
          </section>
        )}

        <hr className="rule my-8" />

        {/* Actions — full width and stacked on phone, primary action obviously solid */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
          <Link to={`/request/${item.id}/edit`} className="btn-secondary w-full sm:w-auto">
            Edit details
          </Link>

          {item.status === "Active" && (
            <button
              onClick={() => doStatus("Ongoing", "Marked as ongoing.")}
              className="btn-secondary w-full sm:w-auto"
            >
              Mark ongoing
            </button>
          )}
          {item.status === "Ongoing" && (
            <button
              onClick={() => doStatus("Active", "Returned to active.")}
              className="btn-secondary w-full sm:w-auto"
            >
              Return to active
            </button>
          )}

          {(item.status === "Active" || item.status === "Ongoing") && (
            <>
              <button
                onClick={() => doStatus("Resolved", "Marked as resolved.")}
                className="btn-secondary w-full sm:w-auto"
              >
                ✓ Mark resolved
              </button>
              <button
                onClick={() => doStatus("Archived", "Moved to archive.", () => navigate("/archive"))}
                className="btn-secondary w-full sm:w-auto"
              >
                Archive
              </button>
            </>
          )}

          {isInactive && (
            <button
              onClick={() => doStatus("Active", "Restored to the active list.", () => navigate("/"))}
              className="btn-secondary w-full sm:w-auto"
            >
              Restore to list
            </button>
          )}

          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-quiet w-full sm:w-auto sm:ml-auto text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            Delete
          </button>
        </div>

        {/* Activity */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Activity</h2>
            <span className="text-sm text-muted-foreground">
              {sortedEvents.length} {sortedEvents.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {/* Post an update — replaces the request body and gets read aloud Wednesday */}
          <div className="bg-card border border-foreground/15 rounded-lg p-4 sm:p-5 mb-6">
            <label className="block">
              <span className="eyebrow block mb-2">Post an update</span>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={2}
                placeholder="What's the update?"
                className="w-full bg-background border border-foreground/25 focus:border-primary outline-none rounded-lg p-3 text-base sm:text-lg leading-relaxed resize-y"
              />
              <span className="block text-sm text-muted-foreground mt-1.5">
                Replaces the request shown above and goes in the next bulletin.
              </span>
            </label>
            <div className="mt-3 flex justify-end">
              <button
                onClick={onAddNote}
                disabled={!noteDraft.trim()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Post update
              </button>
            </div>
          </div>

          <Timeline events={sortedEvents} />
        </section>
      </article>

      {/* Confirm delete */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-foreground/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="bg-card border-t sm:border border-foreground/20 max-w-md w-full p-6 sm:p-8 shadow-2xl rounded-t-lg sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold">Remove this request?</h3>
            <p className="mt-3 text-foreground/85">
              This permanently deletes the entry and its history.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary w-full sm:w-auto">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await remove(item.id);
                    toast.success("Request removed.");
                    navigate("/");
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : "Delete failed.");
                  }
                }}
                className="btn-danger w-full sm:w-auto"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;
