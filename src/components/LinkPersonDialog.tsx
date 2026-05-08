import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";
import type { PrayerRequest } from "@/lib/prayer-types";

interface Props {
  self: PrayerRequest;
  isOpen: boolean;
  onClose: () => void;
}

export const LinkPersonDialog = ({ self, isOpen, onClose }: Props) => {
  const allItems = usePrayerStore((s) => s.items);
  const linkToPerson = usePrayerStore((s) => s.linkToPerson);

  const [query, setQuery] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery(self.title);
    }
  }, [isOpen, self.title]);

  // Hide records that are already in this person's group — no-op links.
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const myGroup = self.personId;
    return allItems
      .filter((i) => i.id !== self.id)
      .filter((i) => myGroup === undefined || i.personId !== myGroup)
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.relationship?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 10);
  }, [allItems, query, self]);

  const onLink = async (other: PrayerRequest) => {
    setLinking(true);
    try {
      await linkToPerson(self.id, other.id);
      toast.success(`Linked to "${other.title}".`);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Link failed.");
    } finally {
      setLinking(false);
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
        <h3 className="text-xl font-semibold">Link to another record for this person</h3>
        <p className="text-base text-muted-foreground mt-2">
          Use this when the same person has multiple separate prayer episodes you want to keep
          distinct but see together. Both records stay; only the link changes.
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
              {candidates.map((c) => (
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
                  </div>
                  <button
                    type="button"
                    onClick={() => onLink(c)}
                    disabled={linking}
                    className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
                  >
                    Link
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button type="button" onClick={onClose} className="btn-quiet">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
