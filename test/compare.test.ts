import { describe, expect, it } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { NepaliDate } from "../src/nepali-date.js";

const bs = (text: string) => NepaliDate.parse(text);

describe("isBefore, isAfter and isEqual", () => {
  const a = bs("2083-07-01");
  const b = bs("2083-07-15");

  it("order two dates", () => {
    expect(a.isBefore(b)).toBe(true);
    expect(a.isAfter(b)).toBe(false);
    expect(b.isAfter(a)).toBe(true);
    expect(b.isBefore(a)).toBe(false);
    expect(a.isEqual(b)).toBe(false);
  });

  it("treat separate objects for the same date as equal", () => {
    const copy = bs("2083-07-01");
    expect(copy === a).toBe(false);
    expect(copy.isEqual(a)).toBe(true);
    expect(copy.isBefore(a)).toBe(false);
    expect(copy.isAfter(a)).toBe(false);
  });

  it("agree with the order of YYYY-MM-DD strings across the table", () => {
    // Day numbers spread over the whole table, compared in every pair.
    const dates = Array.from({ length: 60 }, (_, i) =>
      NepaliDate.fromDays(Math.floor((i * (TOTAL_DAYS - 1)) / 59)),
    ).concat(bs("2083-12-30"), bs("2084-01-01"), bs("2083-03-32"), bs("2083-04-01"));
    for (const x of dates) {
      for (const y of dates) {
        const [sx, sy] = [x.toString(), y.toString()];
        const label = `${sx} vs ${sy}`;
        expect(x.isBefore(y), label).toBe(sx < sy);
        expect(x.isAfter(y), label).toBe(sx > sy);
        expect(x.isEqual(y), label).toBe(sx === sy);
      }
    }
  });

  it("reject anything but a NepaliDate", () => {
    expect(() => a.isBefore("2083-07-15" as never)).toThrow(
      /isBefore takes a NepaliDate; use NepaliDate.parse for strings/,
    );
    expect(() => a.isAfter(undefined as never)).toThrow(TypeError);
    expect(() => a.isEqual({ year: 2083, month: 7, day: 1 } as never)).toThrow(TypeError);
  });
});

describe("isSame", () => {
  // Kartik 1, 2083 is a Sunday.
  const kartik = (day: number) => new NepaliDate(2083, 7, day);

  it("compares days", () => {
    expect(kartik(1).isSame(bs("2083-07-01"), "day")).toBe(true);
    expect(kartik(1).isSame(kartik(2), "day")).toBe(false);
  });

  it("compares weeks, Sunday to Saturday by default", () => {
    expect(kartik(1).isSame(kartik(7), "week")).toBe(true);
    expect(kartik(7).isSame(kartik(8), "week")).toBe(false);
    expect(kartik(1).isSame(bs("2083-06-31"), "week")).toBe(false); // Aswin 31 is a Saturday
  });

  it("uses weekStartsOn for weeks", () => {
    expect(kartik(1).isSame(kartik(2), "week")).toBe(true);
    expect(kartik(1).isSame(kartik(2), "week", { weekStartsOn: 1 })).toBe(false);
    expect(kartik(1).isSame(bs("2083-06-31"), "week", { weekStartsOn: 6 })).toBe(true);
  });

  it("compares months and years", () => {
    expect(kartik(1).isSame(kartik(30), "month")).toBe(true);
    expect(kartik(1).isSame(kartik(30), "week")).toBe(false);
    expect(kartik(30).isSame(bs("2083-08-01"), "month")).toBe(false);
    expect(kartik(1).isSame(bs("2084-07-01"), "month")).toBe(false); // same month, other year
    expect(bs("2083-01-01").isSame(bs("2083-12-30"), "year")).toBe(true);
    expect(bs("2083-12-30").isSame(bs("2084-01-01"), "year")).toBe(false);
  });

  it("matches startOf for every unit across two years", () => {
    const first = bs("2082-11-01");
    for (let i = 0; i < 400; i += 3) {
      const x = first.addDays(i);
      const y = first.addDays(i + 5);
      for (const unit of ["day", "week", "month", "year"] as const) {
        expect(x.isSame(y, unit), `${x} ${y} ${unit}`).toBe(
          x.startOf(unit).isEqual(y.startOf(unit)),
        );
      }
    }
  });

  it("works for weeks that run past the table", () => {
    // The table starts on a Saturday, so with Sunday weeks its first week begins before it.
    expect(() => NepaliDate.MIN_DATE.startOf("week")).toThrow(RangeError);
    expect(NepaliDate.MIN_DATE.isSame(NepaliDate.MIN_DATE, "week")).toBe(true);
    expect(NepaliDate.MIN_DATE.isSame(NepaliDate.MIN_DATE.addDays(1), "week")).toBe(false);
  });

  it("rejects unknown units, bad weekStartsOn and non-dates", () => {
    expect(() => kartik(1).isSame(kartik(2), "quarter" as never)).toThrow(
      /unit must be "day", "week", "month" or "year"/,
    );
    expect(() => kartik(1).isSame(kartik(2), "week", { weekStartsOn: 7 as never })).toThrow(
      /weekStartsOn must be 0/,
    );
    expect(() => kartik(1).isSame("2083-07-02" as never, "day")).toThrow(TypeError);
  });
});

describe("isBetween", () => {
  const from = bs("2083-07-01");
  const to = bs("2083-07-15");

  it("includes both ends", () => {
    expect(from.isBetween(from, to)).toBe(true);
    expect(to.isBetween(from, to)).toBe(true);
    expect(bs("2083-07-08").isBetween(from, to)).toBe(true);
  });

  it("excludes the days just outside", () => {
    expect(bs("2083-06-31").isBetween(from, to)).toBe(false);
    expect(bs("2083-07-16").isBetween(from, to)).toBe(false);
  });

  it("works for a single day", () => {
    expect(from.isBetween(from, from)).toBe(true);
    expect(to.isBetween(from, from)).toBe(false);
  });

  it("agrees with rangeBetween", () => {
    const range = NepaliDate.rangeBetween(from, to);
    for (let i = -3; i <= 18; i++) {
      const date = from.addDays(i);
      const start = date.startInstant();
      expect(date.isBetween(from, to), String(date)).toBe(
        start >= range.start && start < range.end,
      );
    }
  });

  it("rejects a reversed range and anything but NepaliDate instances", () => {
    expect(() => from.isBetween(to, from)).toThrow(
      /isBetween needs from on or before to, got 2083-07-15 and 2083-07-01/,
    );
    expect(() => from.isBetween("2083-07-01" as never, to)).toThrow(TypeError);
  });
});

describe("NepaliDate.compare", () => {
  const a = bs("2083-07-01");
  const b = bs("2083-07-15");

  it("returns -1, 0 or 1", () => {
    expect(NepaliDate.compare(a, b)).toBe(-1);
    expect(NepaliDate.compare(b, a)).toBe(1);
    expect(NepaliDate.compare(a, bs("2083-07-01"))).toBe(0);
  });

  it("sorts dates oldest first when passed straight to sort", () => {
    // Every day in 2083 and the first days of 2084, in a scrambled but fixed order.
    const dates = Array.from({ length: 400 }, (_, i) => bs("2083-01-01").addDays((i * 157) % 400));
    const sorted = [...dates].sort(NepaliDate.compare).map(String);
    expect(sorted).toEqual(dates.map(String).sort());
    expect(sorted[0]).toBe("2083-01-01");
  });

  it("sorts newest first with the arguments swapped", () => {
    const dates = [a, bs("2084-01-01"), b, bs("2082-12-30")];
    expect(dates.sort((x, y) => NepaliDate.compare(y, x)).map(String)).toEqual([
      "2084-01-01",
      "2083-07-15",
      "2083-07-01",
      "2082-12-30",
    ]);
  });

  it("works without NepaliDate in front of it", () => {
    const { compare } = NepaliDate;
    expect([b, a].sort(compare)).toEqual([a, b]);
  });

  it("rejects anything but NepaliDate instances", () => {
    expect(() => NepaliDate.compare(a, "2083-07-15" as never)).toThrow(
      /compare takes a NepaliDate/,
    );
    expect(() => [a, "2083-07-15" as never].sort(NepaliDate.compare)).toThrow(TypeError);
  });
});

describe("NepaliDate.min and NepaliDate.max", () => {
  const a = bs("2083-07-01");
  const b = bs("2083-07-15");
  const c = bs("2082-12-30");

  it("take dates passed separately", () => {
    expect(NepaliDate.min(a, b, c)).toBe(c);
    expect(NepaliDate.max(a, b, c)).toBe(b);
  });

  it("take one array", () => {
    expect(NepaliDate.min([a, b, c])).toBe(c);
    expect(NepaliDate.max([a, b, c])).toBe(b);
  });

  it("return the only date when given one", () => {
    expect(NepaliDate.min(a)).toBe(a);
    expect(NepaliDate.max([a])).toBe(a);
  });

  it("return the first of several equal dates", () => {
    const sameDay = bs("2083-07-01");
    expect(NepaliDate.min(a, sameDay)).toBe(a);
    expect(NepaliDate.max(sameDay, a)).toBe(sameDay);
  });

  it("handle every day in the table as one array", () => {
    // Too many to spread safely into arguments everywhere, so this needs the array form.
    const all = Array.from({ length: TOTAL_DAYS }, (_, i) =>
      NepaliDate.fromDays((i * 7919) % TOTAL_DAYS),
    );
    expect(NepaliDate.min(all)).toEqual(NepaliDate.MIN_DATE);
    expect(NepaliDate.max(all)).toEqual(NepaliDate.MAX_DATE);
  });

  it("reject no dates", () => {
    expect(() => NepaliDate.min()).toThrow(/min needs at least one date/);
    expect(() => NepaliDate.max([])).toThrow(/max needs at least one date/);
  });

  it("reject anything but NepaliDate instances", () => {
    expect(() => NepaliDate.min(a, "2083-07-15" as never)).toThrow(/min takes a NepaliDate/);
    expect(() => NepaliDate.max([a, null as never])).toThrow(/max takes a NepaliDate/);
    expect(() => NepaliDate.min([[a]] as never)).toThrow(TypeError);
  });
});
