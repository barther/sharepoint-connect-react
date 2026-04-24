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
    <div className="min-h-screen">
      <Masthead />

      <section className="container-prose pt-12 pb-6 text-center">
        <p className="eyebrow">The Archive</p>
        <h1 className="font-display mt-3">With Thanksgiving & Remembrance</h1>
        <p className="font-accent italic text-muted-foreground mt-3">
          Prayers answered, prayers laid down, prayers carried into eternity.
        </p>
        <Ornament className="mt-6" />
      </section>

      <section className="container-prose pb-4">
        <div className="flex items-center justify-center gap-8 border-y border-foreground/15 py-3">
          {(["Resolved", "Archived", "All"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-accent text-sm uppercase tracking-[0.18em] pb-1 border-b-2 transition-colors ${
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <main className="container-prose pb-24">
        {visible.length === 0 ? (
          <p className="text-center font-accent italic text-muted-foreground py-16">
            Nothing here yet.
          </p>
        ) : (
          <ul className="divide-y divide-foreground/10">
            {visible.map((item) => (
              <li key={item.id} className="py-6">
                <Link to={`/request/${item.id}`} className="group block">
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h2 className="font-display text-xl leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    <span className="font-accent text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {format(new Date(item.modified), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <StatusBadge status={item.status} />
                    <span className="font-accent text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-foreground/75 leading-relaxed line-clamp-2 text-sm">
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
