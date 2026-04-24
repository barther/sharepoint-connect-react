import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Masthead } from "@/components/Masthead";
import { Ornament } from "@/components/Ornament";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";

type Tab = "Resolved" | "Archived" | "All";

const Archive = () => {
  const items = usePrayerStore((s) => s.items);
  const loading = usePrayerStore((s) => s.loading);
  const loaded = usePrayerStore((s) => s.loaded);
  const error = usePrayerStore((s) => s.error);
  const [tab, setTab] = useState<Tab>("Resolved");

  const visible = useMemo(() => {
    return items
      .filter((i) =>
        tab === "Resolved" ? i.status === "Resolved" :
        tab === "Archived" ? i.status === "Archived" :
        i.status === "Resolved" || i.status === "Archived"
      )
      .sort((a, b) => +new Date(b.modified) - +new Date(a.modified));
  }, [items, tab]);

  return (
    <div className="min-h-screen pb-12">
      <Masthead />

      <section className="container-prose pt-10 sm:pt-14 pb-6 text-center">
        <p className="eyebrow">The Archive</p>
        <h1 className="font-display mt-3">With Thanksgiving & Remembrance</h1>
        <p className="font-accent italic text-muted-foreground mt-3 text-base sm:text-lg">
          Prayers answered, prayers laid down, prayers carried into eternity.
        </p>
        <Ornament className="mt-6" />
      </section>

      <section className="container-prose pb-2">
        <div className="grid grid-cols-3 border-y border-foreground/15">
          {(["Resolved", "Archived", "All"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-accent text-sm sm:text-base uppercase tracking-[0.16em] py-4 min-h-[48px] border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <main className="container-prose">
        {error ? (
          <p className="text-center font-accent italic text-destructive py-16 text-lg">
            Could not load the list: {error}
          </p>
        ) : !loaded && loading ? (
          <p className="text-center font-accent italic text-muted-foreground py-16 text-lg">
            Loading the archive…
          </p>
        ) : visible.length === 0 ? (
          <p className="text-center font-accent italic text-muted-foreground py-16 text-lg">
            Nothing here yet.
          </p>
        ) : (
          <ul className="divide-y divide-foreground/15">
            {visible.map((item) => (
              <li key={item.id} className="py-6 sm:py-7">
                <Link
                  to={`/request/${item.id}`}
                  className="group block -mx-2 px-2 py-2 rounded-sm hover:bg-surface-sunken/40 active:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h2 className="font-display text-2xl leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                    <StatusBadge status={item.status} />
                    <span className="font-accent text-xs sm:text-sm uppercase tracking-[0.16em] text-muted-foreground">
                      {item.category}
                    </span>
                    <span className="font-accent text-sm italic text-muted-foreground tabular-nums">
                      {format(new Date(item.modified), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-foreground/85 leading-relaxed line-clamp-2 text-base sm:text-lg">
                    {item.request}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Archive;
