import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Masthead } from "@/components/Masthead";
import { safeFormat, safeTime } from "@/lib/dates";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";
import { CATEGORIES, type PrayerCategory } from "@/lib/prayer-types";

type Tab = "Resolved" | "Archived" | "All";

const inputClass =
  "w-full bg-card border border-foreground/25 focus:border-primary outline-none rounded-lg px-4 py-3 min-h-[48px] text-base";

const Archive = () => {
  const items = usePrayerStore((s) => s.items);
  const loading = usePrayerStore((s) => s.loading);
  const loaded = usePrayerStore((s) => s.loaded);
  const error = usePrayerStore((s) => s.error);
  const [tab, setTab] = useState<Tab>("Resolved");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PrayerCategory | "All">("All");
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) =>
        tab === "Resolved" ? i.status === "Resolved" :
        tab === "Archived" ? i.status === "Archived" :
        i.status === "Resolved" || i.status === "Archived"
      )
      .filter((i) => {
        if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
        if (!q) return true;
        return (
          i.title.toLowerCase().includes(q) ||
          i.request.toLowerCase().includes(q) ||
          (i.relationship?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => safeTime(b.modified) - safeTime(a.modified));
  }, [items, tab, query, categoryFilter]);

  const filtersActive = query.trim().length > 0 || categoryFilter !== "All";

  return (
    <div className="min-h-screen pb-12">
      <Masthead />

      <section className="container-wide pt-6 pb-2">
        <h1 className="text-2xl font-semibold">Archive</h1>
        <p className="text-base text-muted-foreground mt-1">Resolved and archived requests.</p>
      </section>

      {/* Search */}
      <section className="container-wide pt-2">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            searchRef.current?.blur();
          }}
        >
          <input
            ref={searchRef}
            type="search"
            enterKeyHint="search"
            autoCorrect="off"
            autoCapitalize="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, request, or relationship"
            aria-label="Search archive"
            className={inputClass}
          />
        </form>
      </section>

      {/* Tabs */}
      <section className="container-wide pt-4 pb-2">
        <div className="grid grid-cols-3 border-y border-foreground/15">
          {(["Resolved", "Archived", "All"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm sm:text-base font-medium py-4 min-h-[48px] border-b-2 transition-colors ${
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

      {/* Category filter */}
      <section className="container-wide pb-4">
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
      </section>

      <main className="container-wide">
        {error ? (
          <p className="text-center text-destructive py-16 text-lg">
            Could not load the list: {error}
          </p>
        ) : !loaded && loading ? (
          <p className="text-center text-muted-foreground py-16 text-lg">
            Loading the archive…
          </p>
        ) : visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-16 text-lg">
            {filtersActive ? "No archived requests match your search." : "Nothing here yet."}
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
                    <h2 className="font-display text-2xl leading-tight group-hover:text-primary transition-colors">
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
                        · closed {safeFormat(item.modified, "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-foreground/85 leading-relaxed line-clamp-2 text-base sm:text-lg mt-2">
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
    </div>
  );
};

export default Archive;
