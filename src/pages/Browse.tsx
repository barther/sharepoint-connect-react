import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Masthead } from "@/components/Masthead";
import { Ornament } from "@/components/Ornament";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";
import { CATEGORIES, type PrayerCategory } from "@/lib/prayer-types";

type SortMode = "Newest" | "Oldest" | "NameAsc" | "NameDesc";

const Browse = () => {
  const items = usePrayerStore((s) => s.items);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("Newest");
  const [categoryFilter, setCategoryFilter] = useState<PrayerCategory | "All">("All");

  const visible = useMemo(() => {
    const live = items.filter((i) => i.status === "Active" || i.status === "Ongoing");
    const matched = live.filter((i) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.request.toLowerCase().includes(q) ||
        (i.relationship?.toLowerCase().includes(q) ?? false);
      const matchesCat = categoryFilter === "All" || i.category === categoryFilter;
      return matchesQuery && matchesCat;
    });
    const sorted = [...matched].sort((a, b) => {
      switch (sort) {
        case "Newest": return +new Date(b.created) - +new Date(a.created);
        case "Oldest": return +new Date(a.created) - +new Date(b.created);
        case "NameAsc": return a.title.localeCompare(b.title);
        case "NameDesc": return b.title.localeCompare(a.title);
      }
    });
    return sorted;
  }, [items, query, sort, categoryFilter]);

  const counts = useMemo(() => {
    return {
      Active: items.filter((i) => i.status === "Active").length,
      Ongoing: items.filter((i) => i.status === "Ongoing").length,
    };
  }, [items]);

  return (
    <div className="min-h-screen">
      <Masthead />

      {/* Hero / volume header */}
      <section className="container-prose pt-12 pb-8 text-center">
        <p className="eyebrow">Volume IV · Issue {format(new Date(), "w")}</p>
        <h1 className="font-display mt-3">A Quiet Record of Our Prayers</h1>
        <p className="font-accent italic text-muted-foreground mt-4 text-base">
          “Rejoice always, pray without ceasing, give thanks in all circumstances.”
          <span className="not-italic"> — 1 Thess. 5:16–18</span>
        </p>
        <Ornament className="mt-6" />
        <p className="mt-6 text-sm text-muted-foreground font-accent">
          {counts.Active} active · {counts.Ongoing} ongoing · printed every Wednesday
        </p>
      </section>

      {/* Controls */}
      <section className="container-wide pb-6">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-y border-foreground/15 py-4">
          <div className="flex-1 min-w-[220px]">
            <label className="eyebrow block mb-1">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, request, relationship…"
              className="w-full bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-1 font-body text-base placeholder:italic placeholder:text-muted-foreground/60"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Filter</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as PrayerCategory | "All")}
              className="bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-1 font-accent text-sm"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Order by</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-1 font-accent text-sm"
            >
              <option value="Newest">Most recent</option>
              <option value="Oldest">Oldest first</option>
              <option value="NameAsc">Name, A → Z</option>
              <option value="NameDesc">Name, Z → A</option>
            </select>
          </div>
          <Link
            to="/request/new"
            className="ml-auto font-accent text-sm border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            ＋ New request
          </Link>
        </div>
      </section>

      {/* Entries */}
      <main className="container-prose pb-24">
        {visible.length === 0 ? (
          <p className="text-center font-accent italic text-muted-foreground py-16">
            No requests match your search.
          </p>
        ) : (
          <ul className="divide-y divide-foreground/10">
            {visible.map((item, idx) => (
              <li key={item.id} className="py-7 animate-fade-up" style={{ animationDelay: `${idx * 30}ms` }}>
                <Link to={`/request/${item.id}`} className="group block">
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h2 className="font-display text-2xl leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    <span className="font-accent text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                      {formatDistanceToNow(new Date(item.modified), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <StatusBadge status={item.status} />
                    <span className="font-accent text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {item.category}
                    </span>
                    {item.relationship && (
                      <span className="font-accent text-xs italic text-muted-foreground">
                        · {item.relationship}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/85 leading-relaxed line-clamp-3">
                    {item.request}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Ornament className="mt-16" />
        <p className="text-center font-accent text-xs text-muted-foreground mt-6 italic">
          Bound and printed for the congregation each Wednesday morning.
        </p>
      </main>
    </div>
  );
};

export default Browse;
