import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Masthead } from "@/components/Masthead";
import { Ornament } from "@/components/Ornament";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";
import { CATEGORIES, type PrayerCategory } from "@/lib/prayer-types";

type SortMode = "Newest" | "RecentlyUpdated" | "Oldest" | "NameAsc" | "NameDesc";

const Browse = () => {
  const items = usePrayerStore((s) => s.items);
  const loading = usePrayerStore((s) => s.loading);
  const loaded = usePrayerStore((s) => s.loaded);
  const error = usePrayerStore((s) => s.error);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("Newest");
  const [categoryFilter, setCategoryFilter] = useState<PrayerCategory | "All">("All");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        case "RecentlyUpdated": return +new Date(b.modified) - +new Date(a.modified);
        case "Oldest": return +new Date(a.created) - +new Date(b.created);
        case "NameAsc": return a.title.localeCompare(b.title);
        case "NameDesc": return b.title.localeCompare(a.title);
      }
    });
    return sorted;
  }, [items, query, sort, categoryFilter]);

  const counts = useMemo(() => ({
    Active: items.filter((i) => i.status === "Active").length,
    Ongoing: items.filter((i) => i.status === "Ongoing").length,
  }), [items]);

  const filtersActive = categoryFilter !== "All" || sort !== "Newest";

  return (
    <div className="min-h-screen pb-28 sm:pb-12">
      <Masthead />

      {/* Hero */}
      <section className="container-prose pt-10 sm:pt-14 pb-6 text-center">
        <p className="eyebrow">Volume IV · Issue {format(new Date(), "w")}</p>
        <h1 className="font-display mt-3">A Quiet Record of Our Prayers</h1>
        <p className="font-accent italic text-muted-foreground mt-4 text-base sm:text-lg">
          “Rejoice always, pray without ceasing, give thanks in all circumstances.”
          <span className="block sm:inline mt-1 sm:mt-0 not-italic"> — 1 Thess. 5:16–18</span>
        </p>
        <Ornament className="mt-6" />
        <p className="mt-5 text-base text-muted-foreground font-accent">
          {counts.Active} active · {counts.Ongoing} ongoing
          <span className="block sm:inline">
            <span className="hidden sm:inline"> · </span>printed every Wednesday
          </span>
        </p>
      </section>

      {/* Search + filters */}
      <section className="container-wide pb-4">
        <div className="border-y border-foreground/15 py-4">
          <label className="block">
            <span className="eyebrow block mb-2">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, request, relationship…"
              className="w-full bg-card border border-foreground/25 focus:border-primary outline-none px-4 py-3 min-h-[48px] font-body text-lg placeholder:italic placeholder:text-muted-foreground/70"
            />
          </label>

          {/* Mobile: disclosure. Desktop: always visible inline. */}
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="sm:hidden mt-3 font-accent text-base text-foreground/80 underline underline-offset-4 decoration-foreground/30 min-h-[44px] inline-flex items-center gap-2"
          >
            {filtersOpen ? "Hide" : "Show"} filters & sorting
            {filtersActive && <span className="text-primary">●</span>}
          </button>

          <div className={`${filtersOpen ? "grid" : "hidden"} sm:grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 sm:gap-6 mt-4 sm:mt-4 sm:items-end`}>
            <label className="block">
              <span className="eyebrow block mb-2">Filter by category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as PrayerCategory | "All")}
                className="w-full bg-card border border-foreground/25 focus:border-primary outline-none px-4 py-3 min-h-[48px] font-body text-base"
              >
                <option value="All">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow block mb-2">Order by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="w-full bg-card border border-foreground/25 focus:border-primary outline-none px-4 py-3 min-h-[48px] font-body text-base"
              >
                <option value="Newest">Most recent</option>
                <option value="RecentlyUpdated">Recently updated</option>
                <option value="Oldest">Oldest first</option>
                <option value="NameAsc">Name, A → Z</option>
                <option value="NameDesc">Name, Z → A</option>
              </select>
            </label>
            <Link to="/request/new" className="btn-primary hidden sm:inline-flex">
              <span className="font-bold">＋</span> New request
            </Link>
          </div>
        </div>
      </section>

      {/* Entries */}
      <main className="container-prose">
        {error ? (
          <p className="text-center font-accent italic text-destructive py-16 text-lg">
            Could not load the list: {error}
          </p>
        ) : !loaded && loading ? (
          <p className="text-center font-accent italic text-muted-foreground py-16 text-lg">
            Loading the list…
          </p>
        ) : visible.length === 0 ? (
          <p className="text-center font-accent italic text-muted-foreground py-16 text-lg">
            No requests match your search.
          </p>
        ) : (
          <ul className="divide-y divide-foreground/15">
            {visible.map((item, idx) => (
              <li key={item.id} className="py-7 sm:py-8 animate-fade-up" style={{ animationDelay: `${idx * 30}ms` }}>
                <Link
                  to={`/request/${item.id}`}
                  className="group block -mx-2 px-2 py-2 rounded-sm hover:bg-surface-sunken/40 active:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h2 className="font-display text-2xl sm:text-3xl leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                    <StatusBadge status={item.status} />
                    <span className="font-accent text-xs sm:text-sm uppercase tracking-[0.16em] text-muted-foreground">
                      {item.category}
                    </span>
                    <span className="font-accent text-sm italic text-muted-foreground tabular-nums">
                      {formatDistanceToNow(new Date(item.modified), { addSuffix: true })}
                    </span>
                  </div>
                  {item.relationship && (
                    <p className="font-accent text-sm italic text-muted-foreground mb-2">
                      {item.relationship}
                    </p>
                  )}
                  <p className="text-foreground/90 leading-relaxed line-clamp-3 text-base sm:text-lg">
                    {item.request}
                  </p>
                  <p className="mt-3 font-accent text-sm text-primary group-hover:underline underline-offset-4">
                    Read & update →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Ornament className="mt-14" />
        <p className="text-center font-accent text-sm sm:text-base text-muted-foreground mt-6 italic">
          Bound and printed for the congregation each Wednesday morning.
        </p>
      </main>

      {/* Thumb-reachable new-request button — mobile only */}
      <Link
        to="/request/new"
        className="sm:hidden fixed bottom-5 right-5 z-40 btn-primary shadow-2xl shadow-primary/30 rounded-full px-6 min-h-[56px] text-base"
        aria-label="Add a new prayer request"
      >
        <span className="text-xl font-bold leading-none">＋</span>
        <span>New request</span>
      </Link>
    </div>
  );
};

export default Browse;
