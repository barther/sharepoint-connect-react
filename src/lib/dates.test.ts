import { describe, it, expect } from "vitest";
import { safeFormat, safeDistance, safeTime, daysSince, shortAge, STALE_DAYS } from "./dates";

describe("safeFormat", () => {
  it("formats a valid Date", () => {
    expect(safeFormat(new Date(2026, 3, 29), "MMM d, yyyy")).toBe("Apr 29, 2026");
  });

  it("formats a YYYY-MM-DD string as local — never UTC-shifts the day", () => {
    // Regression test for the bulletin-button bug: `new Date("2026-04-29")`
    // is UTC midnight, which is April 28 in any negative-offset timezone.
    expect(safeFormat("2026-04-29", "MMM d")).toBe("Apr 29");
  });

  it("returns the fallback for null / undefined / empty", () => {
    expect(safeFormat(null, "MMM d")).toBe("—");
    expect(safeFormat(undefined, "MMM d")).toBe("—");
    expect(safeFormat("", "MMM d")).toBe("—");
  });

  it("returns the fallback for malformed input", () => {
    expect(safeFormat("not a date", "MMM d", "missing")).toBe("missing");
  });
});

describe("safeDistance", () => {
  it("returns a relative string for a valid date", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    expect(safeDistance(oneHourAgo)).toMatch(/hour/);
  });

  it("returns the fallback for missing input", () => {
    expect(safeDistance(null)).toBe("");
    expect(safeDistance(undefined, "n/a")).toBe("n/a");
  });
});

describe("safeTime", () => {
  it("returns numeric ms for a valid date", () => {
    expect(safeTime(new Date(2026, 0, 1))).toBeGreaterThan(0);
  });

  it("returns 0 for invalid / missing input — never NaN", () => {
    expect(safeTime(null)).toBe(0);
    expect(safeTime("")).toBe(0);
    expect(safeTime("garbage")).toBe(0);
    expect(Number.isNaN(safeTime(undefined))).toBe(false);
  });

  it("orders dates correctly when used in a sort comparator", () => {
    const items = [
      { d: "2026-04-29" },
      { d: "2026-04-22" },
      { d: "" },
    ];
    const sorted = [...items].sort((a, b) => safeTime(b.d) - safeTime(a.d));
    expect(sorted.map((x) => x.d)).toEqual(["2026-04-29", "2026-04-22", ""]);
  });
});

describe("daysSince", () => {
  it("returns whole days since a past date", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(daysSince(tenDaysAgo)).toBe(10);
  });

  it("returns 0 for a future date — never negative", () => {
    const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    expect(daysSince(tenDaysFromNow)).toBe(0);
  });

  it("returns 0 for missing input", () => {
    expect(daysSince(null)).toBe(0);
  });
});

describe("shortAge", () => {
  it("formats days when under a month", () => {
    expect(shortAge(0)).toBe("0d");
    expect(shortAge(12)).toBe("12d");
    expect(shortAge(29)).toBe("29d");
  });

  it("formats months when between a month and a year", () => {
    expect(shortAge(30)).toBe("1mo");
    expect(shortAge(180)).toBe("6mo");
    expect(shortAge(364)).toBe("12mo");
  });

  it("formats years (and remaining months) past one year", () => {
    expect(shortAge(365)).toBe("1y");
    expect(shortAge(365 + 90)).toBe("1y 3mo");
    expect(shortAge(365 * 2)).toBe("2y");
  });
});

describe("STALE_DAYS", () => {
  it("is 6 months — the threshold the staleness banner uses", () => {
    expect(STALE_DAYS).toBe(180);
  });
});
