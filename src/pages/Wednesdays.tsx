import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Masthead } from "@/components/Masthead";
import { Ornament } from "@/components/Ornament";
import { usePrayerStore } from "@/lib/prayer-store";
import { toast } from "sonner";

const Wednesdays = () => {
  const navigate = useNavigate();
  const items = usePrayerStore((s) => s.items);
  const snapshots = usePrayerStore((s) => s.snapshots);
  const takeSnapshot = usePrayerStore((s) => s.takeSnapshot);

  const sorted = useMemo(
    () =>
      [...snapshots].sort(
        (a, b) => +new Date(b.printedOn) - +new Date(a.printedOn)
      ),
    [snapshots]
  );

  const liveCount = items.filter(
    (i) => i.status === "Active" || i.status === "Ongoing"
  ).length;

  const onPrintNow = () => {
    const snap = takeSnapshot();
    toast.success(`Snapshot saved as ${snap.id}.`);
    navigate(`/print/${snap.id}`);
  };

  return (
    <div className="min-h-screen pb-12">
      <Masthead />

      <section className="container-prose pt-10 sm:pt-14 pb-6 text-center">
        <p className="eyebrow">The Wednesdays</p>
        <h1 className="font-display mt-3">Every Sheet We've Printed</h1>
        <p className="font-accent italic text-muted-foreground mt-3 text-base sm:text-lg">
          Each Wednesday's list, kept exactly as it went to paper.
        </p>
        <Ornament className="mt-6" />
      </section>

      <section className="container-prose">
        <div className="bg-card border border-foreground/20 p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div>
              <p className="eyebrow">This week</p>
              <p className="font-display text-2xl mt-1">
                {liveCount} {liveCount === 1 ? "request" : "requests"} to print
              </p>
              <p className="font-accent italic text-muted-foreground text-base mt-1">
                Freeze the current list as today's Wednesday sheet.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/print" className="btn-secondary">
                Preview
              </Link>
              <button onClick={onPrintNow} className="btn-primary">
                Print this Wednesday
              </button>
            </div>
          </div>
        </div>

        <h2 className="eyebrow mb-3">Past Wednesdays</h2>
        {sorted.length === 0 ? (
          <p className="font-accent italic text-muted-foreground py-10 text-center text-lg">
            No sheets yet. The first one you print will land here.
          </p>
        ) : (
          <ul className="divide-y divide-foreground/15 border-y border-foreground/15">
            {sorted.map((s) => (
              <li key={s.id} className="py-5 sm:py-6">
                <Link
                  to={`/wednesdays/${s.id}`}
                  className="group block -mx-2 px-2 py-2 rounded-sm hover:bg-surface-sunken/40 active:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-display text-2xl group-hover:text-primary transition-colors">
                        {format(new Date(s.printedOn), "EEEE, MMMM d, yyyy")}
                      </h3>
                      <p className="font-accent text-sm text-muted-foreground tabular-nums mt-1">
                        Week {s.isoWeek} · {s.items.length}{" "}
                        {s.items.length === 1 ? "request" : "requests"} · printed by {s.printedBy}
                      </p>
                    </div>
                    <span className="font-accent text-sm text-primary group-hover:underline underline-offset-4">
                      Open →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Wednesdays;
