import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Masthead } from "@/components/Masthead";
import { Ornament } from "@/components/Ornament";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";
import type { PrayerStatus } from "@/lib/prayer-types";

const STATUS_ORDER: PrayerStatus[] = ["Active", "Ongoing"];

const SnapshotView = () => {
  const { weekKey } = useParams();
  const snapshot = usePrayerStore((s) =>
    s.snapshots.find((x) => x.id === weekKey)
  );

  const grouped = useMemo(() => {
    if (!snapshot) return {} as Record<PrayerStatus, typeof snapshot.items>;
    const out: Partial<Record<PrayerStatus, typeof snapshot.items>> = {};
    for (const it of snapshot.items) {
      (out[it.status] ||= []).push(it);
    }
    return out as Record<PrayerStatus, typeof snapshot.items>;
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="min-h-screen">
        <Masthead />
        <div className="container-prose py-24 text-center">
          <p className="font-display text-2xl">No sheet for that week.</p>
          <Link to="/wednesdays" className="font-accent italic text-primary mt-4 inline-block text-lg">
            ← All Wednesdays
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Masthead />

      <article className="container-prose py-8 sm:py-12">
        <Link
          to="/wednesdays"
          className="font-accent text-base text-foreground/80 hover:text-primary inline-flex items-center gap-2 min-h-[44px]"
        >
          <span aria-hidden className="text-xl">←</span> All Wednesdays
        </Link>

        <header className="mt-4 pb-6 border-b border-foreground/15 text-center">
          <p className="eyebrow">Week {snapshot.isoWeek}, {snapshot.isoYear}</p>
          <h1 className="font-display mt-2">
            {format(new Date(snapshot.printedOn), "MMMM d, yyyy")}
          </h1>
          <p className="font-accent italic text-muted-foreground mt-3 text-base">
            Printed by {snapshot.printedBy} ·{" "}
            {format(new Date(snapshot.printedOn), "h:mm a")}
          </p>
          <Ornament className="mt-6" />
        </header>

        <div className="mt-8 flex justify-center">
          <Link to={`/print/${snapshot.id}`} className="btn-primary">
            Open print view
          </Link>
        </div>

        <div className="mt-12 space-y-12">
          {STATUS_ORDER.map((status) => {
            const list = grouped[status];
            if (!list || list.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="font-display text-2xl sm:text-3xl border-b border-foreground/15 pb-2 mb-6">
                  {status}
                </h2>
                <ul className="divide-y divide-foreground/15">
                  {list.map((item) => (
                    <li key={item.id} className="py-5">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                        <h3 className="font-display text-xl">{item.title}</h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                        <span className="font-accent text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {item.category}
                        </span>
                        {item.relationship && (
                          <span className="font-accent text-sm italic text-muted-foreground">
                            {item.relationship}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground/85 leading-relaxed text-base sm:text-lg">
                        {item.request}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </article>
    </div>
  );
};

export default SnapshotView;
