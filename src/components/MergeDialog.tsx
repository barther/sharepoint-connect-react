import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";
import type { PrayerRequest } from "@/lib/prayer-types";

interface Props {
  canonical: PrayerRequest;
  isOpen: boolean;
  onClose: () => void;
}

export const MergeDialog = ({ canonical, isOpen, onClose }: Props) => {
  const allItems = usePrayerStore((s) => s.items);
  const allEvents = usePrayerStore((s) => s.events);
  const mergeInto = usePrayerStore((s) => s.mergeInto);

  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<PrayerRequest | null>(null);
  const [merging, setMerging] = useState(false);

  // Default the search to the canonical's title each time the dialog opens.
  useEffect(() => {
    if (isOpen) {
      setQuery(canonical.title);
      setConfirming(null);
    }
  }, [isOpen, canonical.title]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return allItems
      .filter((i) => i.id !== canonical.id)
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.relationship?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 10);
  }, [allItems, query, canonical]);

  const eventCountFor = (id: number) =>
    allEvents.filter((e) => e.requestId === id).length;

  const onConfirmMerge = async () => {
    if (!confirming) return;
    setMerging(true);
    try {
      await mergeInto(canonical.id, confirming.id);
      toast.success(`Merged "${confirming.title}" into this record.`);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Merge failed.");
    } finally {
      setMerging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-foreground/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border-t sm:border border-foreground/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-t-lg sm:rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!confirming ? (
          <>
            <h3 className="text-xl font-semibold">Merge another request into this one</h3>
            <p className="text-base text-muted-foreground mt-2">
              Pick the duplicate to merge in. Its activity will be moved here, then it'll be deleted.
              The current record's text and category stay as they are.
            </p>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name"
              autoCorrect="off"
              autoCapitalize="off"
              className="w-full bg-background border border-foreground/25 focus:border-primary outline-none rounded-lg px-4 py-3 min-h-[48px] text-base mt-5"
            />

            <div className="mt-4">
              {query.trim().length < 2 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Type a name to search.
                </p>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No other records match.
                </p>
              ) : (
                <ul className="divide-y divide-foreground/15 border-y border-foreground/15">
                  {candidates.map((c) => {
                    const count = eventCountFor(c.id);
                    return (
                      <li key={c.id} className="flex items-center gap-3 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-display text-lg sm:text-xl">{c.title}</span>
                            <StatusBadge status={c.status} />
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                              {c.category}
                            </span>
                          </div>
                          {c.relationship && (
                            <p className="text-sm text-muted-foreground mt-0.5">{c.relationship}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {count} {count === 1 ? "entry" : "entries"} of activity
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirming(c)}
                          className="btn-secondary text-sm whitespace-nowrap"
                        >
                          Merge in
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button type="button" onClick={onClose} className="btn-quiet">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold">Confirm merge</h3>
            <p className="mt-3 text-foreground/90 text-base sm:text-lg leading-relaxed">
              This will move{" "}
              <strong>{eventCountFor(confirming.id)}</strong>{" "}
              {eventCountFor(confirming.id) === 1 ? "entry" : "entries"} of activity from{" "}
              <strong>"{confirming.title}"</strong> into <strong>"{canonical.title}"</strong>,
              then delete <strong>"{confirming.title}"</strong>.
            </p>
            {confirming.dateSubmitted &&
              canonical.dateSubmitted &&
              confirming.dateSubmitted < canonical.dateSubmitted && (
                <p className="mt-3 text-sm text-muted-foreground">
                  "On the list since" will inherit the earlier date ({confirming.dateSubmitted}).
                </p>
              )}
            <p className="mt-4 text-sm text-destructive font-medium">
              This cannot be undone.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={merging}
                className="btn-secondary w-full sm:w-auto disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onConfirmMerge}
                disabled={merging}
                className="btn-danger w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {merging ? "Merging…" : "Yes, merge"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
