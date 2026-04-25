import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Masthead } from "@/components/Masthead";
import { safeDistance, safeFormat, safeTime } from "@/lib/dates";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";
import { CATEGORIES, type PrayerCategory } from "@/lib/prayer-types";

type SortMode = "Newest" | "RecentlyUpdated" | "Oldest" | "NameAsc" | "NameDesc";

const inputClass =
  "w-full bg-card border border-foreground/25 focus:border-primary outline-none rounded-lg px-4 py-3 min-h-[48px] text-base";

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
        case "Newest": return safeTime(b.created) - safeTime(a.created);
        case "RecentlyUpdated": return safeTime(b.modified) - safeTime(a.modified);
        case "Oldest": return safeTime(a.created) - safeTime(b.created);
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

      {/* Counts + new-request button */}
      <section className="container-wide pt-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-base text-muted-foreground">
            <span className="font-semibold text-foreground">{counts.Active}</span> active
            <span className="mx-2 text-foreground/30">·</span>
            <span className="font-semibold text-foreground">{counts.Ongoing}</span> ongoing
          </p>
          <Link to="/request/new" className="btn-primary hidden sm:inline-flex">
            <span aria-hidden className="text-lg leading-none">＋</span> New request
          </Link>
        </div>
      </section>

      {/* Search + filters */}
      <section className="container-wide pb-4">
        <div className="border-y border-foreground/15 py-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, request, or relationship"
            aria-label="Search"
            className={inputClass}
          />

          {/* Mobile: disclosure. Desktop: always visible inline. */}
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="sm:hidden mt-3 text-base text-foreground font-medium underline underline-offset-4 decoration-foreground/30 min-h-[44px] inline-flex items-center gap-2"
          >
            {filtersOpen ? "Hide" : "Show"} filters
            {filtersActive && <span className="w-2 h-2 rounded-full bg-primary" aria-hidden />}
          </button>

          <div className={`${filtersOpen ? "grid" : "hidden"} sm:grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4`}>
            <label className="block">
              <span className="eyebrow block mb-2">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as PrayerCategory | "All")}
                className={inputClass}
              >
                <option value="All">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow block mb-2">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className={inputClass}
              >
                <option value="Newest">Most recent</option>
                <option value="RecentlyUpdated">Recently updated</option>
                <option value="Oldest">Oldest first</option>
                <option value="NameAsc">Name, A → Z</option>
                <option value="NameDesc">Name, Z → A</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Entries */}
      <main className="container-wide">
        {error ? (
          <p className="text-center text-destructive py-16 text-lg">
            Could not load the list: {error}
          </p>
        ) : !loaded && loading ? (
          <p className="text-center text-muted-foreground py-16 text-lg">
            Loading the list…
          </p>
        ) : visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-16 text-lg">
            No requests match your search.
          </p>
        ) : (
          <ul className="divide-y divide-foreground/15">
            {visible.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/request/${item.id}`}
                  className="group flex items-start gap-4 py-5 sm:py-6 px-2 -mx-2 rounded-lg hover:bg-surface-sunken/50 active:bg-surface-sunken transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-2xl sm:text-3xl leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        {item.category}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        Submitted {safeFormat(item.dateSubmitted, "MMM d, yyyy")}
                      </span>
                      <span className="text-sm text-muted-foreground/80 tabular-nums">
                        · updated {safeDistance(item.modified)}
                      </span>
                    </div>
                    {item.relationship && (
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {item.relationship}
                      </p>
                    )}
                    <p className="text-foreground/90 leading-relaxed line-clamp-2 text-base sm:text-lg mt-2">
                      {item.request}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="text-2xl text-muted-foreground/60 group-hover:text-primary leading-none mt-1.5 select-none"
                  >
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Thumb-reachable new-request button — mobile only */}
      <Link
        to="/request/new"
        className="sm:hidden fixed bottom-5 right-5 z-40 btn-primary shadow-xl rounded-full px-6 min-h-[56px] text-base"
        aria-label="Add a new prayer request"
      >
        <span aria-hidden className="text-xl leading-none">＋</span>
        <span>New request</span>
      </Link>
    </div>
  );
};

export default Browse;
