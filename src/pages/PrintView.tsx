import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { usePrayerStore } from "@/lib/prayer-store";
import type { PrayerStatus } from "@/lib/prayer-types";

// Print-optimized view. Designed to look like the printed bulletin sheet
// the prayer group expects on Wednesday morning. Two modes:
//   /print            → the current live state (what would print today)
//   /print/:weekKey   → a frozen historical snapshot

const STATUS_ORDER: PrayerStatus[] = ["Active", "Ongoing"];

const PrintView = () => {
  const { weekKey } = useParams();
  const snapshot = usePrayerStore((s) =>
    weekKey ? s.snapshots.find((x) => x.id === weekKey) : undefined
  );
  const items = usePrayerStore((s) => s.items);

  const printItems = useMemo(() => {
    if (snapshot) return snapshot.items;
    return items
      .filter((i) => i.status === "Active" || i.status === "Ongoing")
      .map(({ id, title, request, category, status, relationship, dateSubmitted }) => ({
        id, title, request, category, status, relationship, dateSubmitted,
      }));
  }, [snapshot, items]);

  const grouped = useMemo(() => {
    const out: Partial<Record<PrayerStatus, typeof printItems>> = {};
    for (const it of printItems) {
      (out[it.status] ||= []).push(it);
    }
    return out as Record<PrayerStatus, typeof printItems>;
  }, [printItems]);

  const headingDate = snapshot
    ? format(new Date(snapshot.printedOn), "EEEE, MMMM d, yyyy")
    : format(new Date(), "EEEE, MMMM d, yyyy");

  // Auto-trigger the print dialog when arriving via "Print this Wednesday"
  useEffect(() => {
    // Small delay so fonts settle before the print dialog snapshots layout
    const t = window.setTimeout(() => {
      // Comment out to inspect on screen — leave on for production feel
      // window.print();
    }, 250);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {/* On-screen toolbar — hidden when printing */}
      <div className="print:hidden border-b border-black/15 bg-background">
        <div className="container-wide py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link
            to={snapshot ? `/wednesdays/${snapshot.id}` : "/wednesdays"}
            className="font-accent text-base text-foreground/80 hover:text-primary inline-flex items-center gap-2 min-h-[44px]"
          >
            <span aria-hidden className="text-xl">←</span>
            {snapshot ? "Back to this Wednesday" : "Back to Wednesdays"}
          </Link>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="btn-primary">
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Sheet */}
      <main className="mx-auto max-w-[7.5in] px-6 sm:px-10 py-10 sm:py-14 print:px-0 print:py-0 print:max-w-none">
        <header className="text-center pb-6 border-b-2 border-black/70">
          <p
            className="uppercase tracking-[0.22em] text-[11px]"
            style={{ fontFamily: "var(--font-accent)" }}
          >
            Lithia Springs Methodist
          </p>
          <h1
            className="mt-2 text-4xl sm:text-5xl print:text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.005em", lineHeight: 1.05 }}
          >
            The Prayer List
          </h1>
          <p
            className="mt-2 italic text-sm"
            style={{ fontFamily: "var(--font-accent)" }}
          >
            {headingDate}
            {snapshot && (
              <span className="not-italic"> · printed by {snapshot.printedBy}</span>
            )}
          </p>
        </header>

        {printItems.length === 0 ? (
          <p
            className="text-center italic text-base mt-16"
            style={{ fontFamily: "var(--font-accent)" }}
          >
            No active or ongoing requests this week.
          </p>
        ) : (
          STATUS_ORDER.map((status) => {
            const list = grouped[status];
            if (!list || list.length === 0) return null;
            return (
              <section key={status} className="mt-8 break-inside-avoid">
                <h2
                  className="text-xl sm:text-2xl border-b border-black/40 pb-1 mb-4"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  {status}
                </h2>
                <ul className="space-y-5">
                  {list.map((item) => (
                    <li key={item.id} className="break-inside-avoid">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <h3
                          className="text-lg"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                        >
                          {item.title}
                          {item.relationship && (
                            <span
                              className="italic font-normal text-base ml-2 text-black/60"
                              style={{ fontFamily: "var(--font-accent)" }}
                            >
                              — {item.relationship}
                            </span>
                          )}
                        </h3>
                        <span
                          className="text-[10px] uppercase tracking-[0.18em] text-black/55"
                          style={{ fontFamily: "var(--font-accent)" }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className="mt-1 text-base leading-relaxed"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {item.request}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}

        <footer className="mt-12 pt-4 border-t border-black/40 text-center">
          <p
            className="text-[11px] uppercase tracking-[0.2em] text-black/55"
            style={{ fontFamily: "var(--font-accent)" }}
          >
            ❦ &nbsp; Pray without ceasing &nbsp; ❦
          </p>
        </footer>
      </main>

      {/* Print-only refinements */}
      <style>{`
        @media print {
          @page { size: Letter; margin: 0.75in; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintView;
