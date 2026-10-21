import { inspect } from "node:util";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { FIRST_YEAR, LAST_YEAR } from "../src/defined.js";
import {
  type FiscalQuarter,
  type FiscalYear,
  type InstantRange,
  NepaliDate,
} from "../src/nepali-date.js";

describe("NepaliDate construction", () => {
  it("accepts valid dates", () => {
    expect(new NepaliDate(2083, 6, 26).toString()).toBe("2083-06-26");
    expect(new NepaliDate(1975, 1, 1).toString()).toBe("1975-01-01"); // first day in table
    expect(new NepaliDate(2086, 12, 30).toString()).toBe("2086-12-30"); // last day in table
  });

  it.each([
    [1974, 1, 1], // before table
    [2087, 1, 1], // after table
    [2083, 0, 1], // month too low
    [2083, 13, 1], // month too high
    [2083, 1, 0], // day too low
    [2083, 6, 32], // Aswin 2083 has 31 days
    [2083, 6.5, 1], // not an integer
    [NaN, 1, 1],
  ])("rejects %i-%i-%i", (y, m, d) => {
    expect(() => new NepaliDate(y, m, d)).toThrow(RangeError);
  });

  it("is frozen", () => {
    const d = new NepaliDate(2083, 6, 26);
    expect(Object.isFrozen(d)).toBe(true);
    expect(() => {
      (d as { year: number }).year = 2000;
    }).toThrow(TypeError);
  });

  it("keeps the internal day number out of keys, copies and logs", () => {
    const d = new NepaliDate(2083, 6, 26);
    expect(Object.keys(d)).toEqual(["year", "month", "day"]);
    expect({ ...d }).toStrictEqual({ year: 2083, month: 6, day: 26 });
    expect(Object.assign({}, d)).toStrictEqual({ year: 2083, month: 6, day: 26 });
    expect(structuredClone(d)).toStrictEqual({ year: 2083, month: 6, day: 26 });
    expect(inspect(d)).toBe("NepaliDate { year: 2083, month: 6, day: 26 }"); // what console.log prints
  });

  it("keeps the internal day number read-only", () => {
    const d = new NepaliDate(2083, 6, 26);
    expect(() => {
      (d as unknown as { days: number }).days = 0;
    }).toThrow(TypeError);
    expect(d.toAd()).toEqual({ year: 2026, month: 10, day: 12 });
  });

  it("converts to AD", () => {
    const d = new NepaliDate(2083, 6, 26);
    expect(d.toAd()).toEqual({ year: 2026, month: 10, day: 12 });
    expect(d.toAdString()).toBe("2026-10-12");
  });

  it("converts from AD", () => {
    const d = NepaliDate.fromAd(2026, 10, 12);
    expect(NepaliDate.fromAd("2026-10-12").toString()).toBe("2083-06-26");
    expect(d.toString()).toBe("2083-06-26");
  });
});

describe("NepaliDate.fromAd with a string", () => {
  it.each(["2026-10-12", "2026/10/12", "2026.10.12", "2026 10 12"])("reads %j", (text) => {
    expect(NepaliDate.fromAd(text).toString()).toBe("2083-06-26");
  });

  it("reads unpadded months and days", () => {
    expect(NepaliDate.fromAd("2026-1-5").toString()).toBe(NepaliDate.fromAd(2026, 1, 5).toString());
  });

  it("matches the numeric form for every day in the table", () => {
    for (let days = 0; days < TOTAL_DAYS; days++) {
      const bs = NepaliDate.fromDays(days);
      const adText = bs.toAdString();
      if (NepaliDate.fromAd(adText).toString() !== bs.toString()) {
        expect.fail(`fromAd(${JSON.stringify(adText)}) did not return ${bs.toString()}`);
      }
    }
  });

  it.each([
    "12/10/2026", // day first
    "10-12-2026", // month first
    "2026-10/12", // mixed separators
    "2026-10-12T00:00:00Z", // timestamp: use fromInstant (v0.2)
    "26-10-12", // 2-digit year
    "",
  ])("rejects the format %j", (text) => {
    expect(() => NepaliDate.fromAd(text)).toThrow(RangeError);
  });

  it.each([
    "2026-02-30", // no 30 February
    "2026-13-01", // no month 13
    "1918-04-12", // the day before the table starts
    "2031-01-01", // after the table
  ])("rejects the impossible or unsupported date %j", (text) => {
    expect(() => NepaliDate.fromAd(text)).toThrow(RangeError);
  });
});

describe("calendar info", () => {
  it("gives the days in a month", () => {
    expect(NepaliDate.daysInMonth(2083, 1)).toBe(31); // Baisakh
    expect(NepaliDate.daysInMonth(2083, 3)).toBe(32); // Asar
    expect(NepaliDate.daysInMonth(2083, 8)).toBe(29); // Mangsir
    expect(NepaliDate.daysInMonth(1993, 4)).toBe(32); // Shrawan 1993, a resolved disputed year
  });

  it("gives the days in a year", () => {
    expect(NepaliDate.daysInYear(2083)).toBe(365);
    expect(NepaliDate.daysInYear(2081)).toBe(366);
  });

  it("gives the weekday with 0 = Sunday", () => {
    expect(new NepaliDate(2083, 6, 26).dayOfWeek).toBe(1); // Monday, 2026-10-12
    expect(new NepaliDate(2083, 6, 25).dayOfWeek).toBe(0); // Sunday, 2026-10-11
    expect(new NepaliDate(2083, 6, 31).dayOfWeek).toBe(6); // Saturday, 2026-10-17
  });

  it("adds up month lengths to the year length for every supported year", () => {
    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      let total = 0;
      for (let month = 1; month <= 12; month++) total += NepaliDate.daysInMonth(year, month);
      expect(total, `BS ${year}`).toBe(NepaliDate.daysInYear(year));
    }
  });

  it.each([
    [FIRST_YEAR - 1, 1],
    [LAST_YEAR + 1, 1],
    [2083, 0],
    [2083, 13],
    [2083, 1.5],
  ])("rejects daysInMonth(%s, %s)", (year, month) => {
    expect(() => NepaliDate.daysInMonth(year, month)).toThrow(RangeError);
  });

  it("rejects daysInYear outside the table", () => {
    expect(() => NepaliDate.daysInYear(FIRST_YEAR - 1)).toThrow(RangeError);
    expect(() => NepaliDate.daysInYear(LAST_YEAR + 1)).toThrow(RangeError);
  });

  it("exposes the month and year length on a date", () => {
    const d = new NepaliDate(2083, 6, 26);
    expect(d.daysInMonth).toBe(31);
    expect(d.daysInYear).toBe(365);
  });

  it("reports valid and invalid dates without throwing", () => {
    expect(NepaliDate.isValid(2083, 6, 26)).toBe(true);
    expect(NepaliDate.isValid(2083, 3, 32)).toBe(true); // Asar 2083 has 32 days
    expect(NepaliDate.isValid(2083, 6, 32)).toBe(false); // Aswin 2083 has 31
    expect(NepaliDate.isValid(FIRST_YEAR - 1, 1, 1)).toBe(false);
    expect(NepaliDate.isValid(2083, 13, 1)).toBe(false);
    expect(NepaliDate.isValid(2083, 6.5, 1)).toBe(false);
    expect(NepaliDate.isValid(NaN, 1, 1)).toBe(false);
  });

  it("agrees with the constructor for every day 0–33 of every month in the table", () => {
    for (let year = FIRST_YEAR - 1; year <= LAST_YEAR + 1; year++) {
      for (let month = 0; month <= 13; month++) {
        for (let day = 0; day <= 33; day++) {
          let constructs = true;
          try {
            new NepaliDate(year, month, day);
          } catch {
            constructs = false;
          }
          if (NepaliDate.isValid(year, month, day) !== constructs) {
            expect.fail(`isValid(${year}, ${month}, ${day}) disagrees with the constructor`);
          }
        }
      }
    }
  });

  it("has MIN_DATE and MAX_DATE at the ends of the table", () => {
    expect(NepaliDate.MIN_DATE.toString()).toBe(`${FIRST_YEAR}-01-01`);
    expect(NepaliDate.MAX_DATE.toString()).toBe(
      `${LAST_YEAR}-12-${NepaliDate.daysInMonth(LAST_YEAR, 12)}`,
    );
    expect(NepaliDate.MIN_DATE.toAd()).toEqual({ year: 1918, month: 4, day: 13 });
    expect(NepaliDate.MAX_DATE.toAd()).toEqual({ year: 2030, month: 4, day: 13 });
  });
});

describe("fiscalYear", () => {
  const fy2083 = { startYear: 2083, endYear: 2084, label: "2083/84" };

  it.each([
    ["2083-04-01", fy2083], // Shrawan 1, the first day
    ["2083-06-26", fy2083],
    ["2083-12-30", fy2083], // Chaitra, the end of the BS year
    ["2084-01-01", fy2083], // Baisakh 1 stays in the fiscal year that began in 2083
    [`2084-03-${NepaliDate.daysInMonth(2084, 3)}`, fy2083], // the last day of Asar
    ["2083-03-32", { startYear: 2082, endYear: 2083, label: "2082/83" }],
    ["2083-01-01", { startYear: 2082, endYear: 2083, label: "2082/83" }],
  ])("puts %s in the right fiscal year", (text, expected) => {
    expect(NepaliDate.parse(text).fiscalYear()).toEqual(expected);
  });

  it("pads the end year's last two digits across a century", () => {
    expect(new NepaliDate(2000, 1, 1).fiscalYear().label).toBe("1999/00");
    expect(new NepaliDate(2000, 4, 1).fiscalYear().label).toBe("2000/01");
    expect(new NepaliDate(2009, 4, 1).fiscalYear().label).toBe("2009/10");
  });

  it("gives the fiscal year before the table for its first Baisakh to Asar", () => {
    expect(NepaliDate.MIN_DATE.fiscalYear()).toEqual({
      startYear: FIRST_YEAR - 1,
      endYear: FIRST_YEAR,
      label: `${FIRST_YEAR - 1}/${String(FIRST_YEAR % 100).padStart(2, "0")}`,
    });
  });

  it("changes on Shrawan 1 and on no other day in the table", () => {
    let previous = NepaliDate.MIN_DATE.fiscalYear();
    for (let days = 1; days < TOTAL_DAYS; days++) {
      const date = NepaliDate.fromDays(days);
      const current = date.fiscalYear();
      const isShrawan1 = date.month === 4 && date.day === 1;
      if ((current.startYear !== previous.startYear) !== isShrawan1) {
        expect.fail(`fiscal year went from ${previous.label} to ${current.label} on ${date}`);
      }
      if (isShrawan1 && current.startYear !== previous.startYear + 1) {
        expect.fail(`fiscal year jumped from ${previous.label} to ${current.label} on ${date}`);
      }
      previous = current;
    }
  });

  it("returns a new object every call", () => {
    const date = new NepaliDate(2083, 6, 26);
    const first = date.fiscalYear();
    first.label = "changed";
    expect(date.fiscalYear().label).toBe("2083/84");
    expectTypeOf(first).toEqualTypeOf<FiscalYear>();
  });
});

describe("fiscal year ranges", () => {
  const iso = ({ start, end }: { start: Date; end: Date }) => [
    start.toISOString(),
    end.toISOString(),
  ];
  // Every day of fiscal year 2083/84, from its first day to its last.
  const fy2083 = ["2083-04-01", "2083-06-26", "2083-12-30", "2084-01-01", "2084-03-32"];

  it("gives the moments Shrawan 1 starts in Kathmandu, this year and next", () => {
    for (const text of fy2083) {
      expect(iso(NepaliDate.parse(text).range("fiscalYear")), text).toEqual([
        "2026-07-16T18:15:00.000Z",
        "2027-07-16T18:15:00.000Z",
      ]);
    }
  });

  it("gives the AD dates of Shrawan 1, this year and next", () => {
    for (const text of fy2083) {
      expect(NepaliDate.parse(text).adRange("fiscalYear"), text).toEqual({
        start: "2026-07-17",
        end: "2027-07-17",
      });
    }
  });

  it("gives Shrawan 1 and the last day of Asar as startOf and endOf", () => {
    for (const text of fy2083) {
      const date = NepaliDate.parse(text);
      expect(date.startOf("fiscalYear").toString(), text).toBe("2083-04-01");
      expect(date.endOf("fiscalYear").toString(), text).toBe("2084-03-32");
    }
  });

  it("uses each end's own offset across the 1986 change", () => {
    // Fiscal year 2042/43 started at +05:30 and ended at +05:45.
    expect(iso(new NepaliDate(2042, 6, 1).range("fiscalYear"))).toEqual([
      "1985-07-15T18:30:00.000Z",
      "1986-07-15T18:15:00.000Z",
    ]);
  });

  it("takes the same options as the other units", () => {
    const date = new NepaliDate(2083, 6, 26);
    expect(date.range("fiscalYear", { as: "iso" })).toEqual({
      start: "2026-07-16T18:15:00.000Z",
      end: "2027-07-16T18:15:00.000Z",
    });
    expect(date.range("fiscalYear", { as: "ms", offsetMinutes: 0 })).toEqual({
      start: Date.UTC(2026, 6, 17),
      end: Date.UTC(2027, 6, 17),
    });
  });

  it("covers every whole fiscal year in the table back to back, matching rangeBetween", () => {
    for (let year = FIRST_YEAR; year < LAST_YEAR; year++) {
      const shrawan1 = new NepaliDate(year, 4, 1);
      const nextShrawan1 = new NepaliDate(year + 1, 4, 1);
      const lastAsar = nextShrawan1.addDays(-1);
      const label = `${year}/${year + 1}`;
      expect(lastAsar.month, label).toBe(3);
      expect(lastAsar.endOf("fiscalYear"), label).toEqual(lastAsar);
      expect(lastAsar.startOf("fiscalYear"), label).toEqual(shrawan1);
      expect(shrawan1.range("fiscalYear"), label).toEqual(
        NepaliDate.rangeBetween(shrawan1, lastAsar),
      );
      expect(lastAsar.adRange("fiscalYear"), label).toEqual({
        start: shrawan1.toAdString(),
        end: nextShrawan1.toAdString(),
      });
    }
  });

  it("rejects the fiscal years that run past either end of the table", () => {
    expect(() => NepaliDate.MIN_DATE.range("fiscalYear")).toThrow(
      /fiscal year 1974\/75 containing 1975-01-01 runs outside the supported range/,
    );
    expect(() => new NepaliDate(FIRST_YEAR, 3, 1).adRange("fiscalYear")).toThrow(RangeError);
    expect(() => NepaliDate.MAX_DATE.adRange("fiscalYear")).toThrow(
      /fiscal year 2086\/87 containing 2086-12-30 runs outside the supported range/,
    );
    expect(() => new NepaliDate(LAST_YEAR, 4, 1).startOf("fiscalYear")).toThrow(RangeError);
    // The first and last whole fiscal years still work.
    expect(new NepaliDate(FIRST_YEAR, 4, 1).startOf("fiscalYear").toString()).toBe("1975-04-01");
    const lastAsar = new NepaliDate(LAST_YEAR, 3, NepaliDate.daysInMonth(LAST_YEAR, 3));
    expect(lastAsar.range("fiscalYear").end).toEqual(
      new NepaliDate(LAST_YEAR, 4, 1).startInstant(),
    );
  });

  it("compares with isSame, even past the ends of the table", () => {
    const bs = NepaliDate.parse;
    expect(bs("2083-12-30").isSame(bs("2084-01-01"), "fiscalYear")).toBe(true);
    expect(bs("2083-04-01").isSame(bs("2084-03-32"), "fiscalYear")).toBe(true);
    expect(bs("2083-03-32").isSame(bs("2083-04-01"), "fiscalYear")).toBe(false);
    expect(NepaliDate.MIN_DATE.isSame(new NepaliDate(FIRST_YEAR, 3, 1), "fiscalYear")).toBe(true);
    expect(NepaliDate.MIN_DATE.isSame(new NepaliDate(FIRST_YEAR, 4, 1), "fiscalYear")).toBe(false);
    expect(NepaliDate.MAX_DATE.isSame(new NepaliDate(LAST_YEAR, 4, 1), "fiscalYear")).toBe(true);
    expect(NepaliDate.MAX_DATE.isSame(new NepaliDate(LAST_YEAR, 3, 1), "fiscalYear")).toBe(false);
  });
});

describe("fiscal quarters", () => {
  const iso = ({ start, end }: { start: Date; end: Date }) => [
    start.toISOString(),
    end.toISOString(),
  ];
  // The quarters of fiscal year 2083/84: a date in each, its first and last days, the moments
  // they start and the AD dates they cover. Quarter 4 is in BS 2084.
  const quarters = [
    {
      quarter: 1,
      date: "2083-06-26",
      first: "2083-04-01",
      last: "2083-06-31",
      instants: ["2026-07-16T18:15:00.000Z", "2026-10-17T18:15:00.000Z"],
      ad: { start: "2026-07-17", end: "2026-10-18" },
    },
    {
      quarter: 2,
      date: "2083-08-10",
      first: "2083-07-01",
      last: "2083-09-30",
      instants: ["2026-10-17T18:15:00.000Z", "2027-01-14T18:15:00.000Z"],
      ad: { start: "2026-10-18", end: "2027-01-15" },
    },
    {
      quarter: 3,
      date: "2083-11-05",
      first: "2083-10-01",
      last: "2083-12-30",
      instants: ["2027-01-14T18:15:00.000Z", "2027-04-13T18:15:00.000Z"],
      ad: { start: "2027-01-15", end: "2027-04-14" },
    },
    {
      quarter: 4,
      date: "2084-02-01",
      first: "2084-01-01",
      last: "2084-03-32",
      instants: ["2027-04-13T18:15:00.000Z", "2027-07-16T18:15:00.000Z"],
      ad: { start: "2027-04-14", end: "2027-07-17" },
    },
  ];

  it.each(quarters)("gives quarter $quarter from $first to $last", (q) => {
    for (const text of [q.first, q.date, q.last]) {
      const date = NepaliDate.parse(text);
      expect(date.fiscalQuarter(), text).toBe(q.quarter);
      expect(date.fiscalYear().label, text).toBe("2083/84");
      expect(date.startOf("fiscalQuarter").toString(), text).toBe(q.first);
      expect(date.endOf("fiscalQuarter").toString(), text).toBe(q.last);
      expect(iso(date.range("fiscalQuarter")), text).toEqual(q.instants);
      expect(date.adRange("fiscalQuarter"), text).toEqual(q.ad);
    }
  });

  it("numbers the months from Shrawan, three to a quarter", () => {
    const byMonth = Array.from({ length: 12 }, (_, i) => new NepaliDate(2083, i + 1, 1));
    expect(byMonth.map((date) => date.fiscalQuarter())).toEqual([
      4, 4, 4, 1, 1, 1, 2, 2, 2, 3, 3, 3,
    ]);
    expectTypeOf(byMonth[0].fiscalQuarter()).toEqualTypeOf<FiscalQuarter>();
  });

  it("covers every month in the table with quarters back to back that make up each fiscal year", () => {
    let previous: NepaliDate | undefined;
    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      for (const firstMonth of [1, 4, 7, 10]) {
        const first = new NepaliDate(year, firstMonth, 1);
        const last = first.endOf("fiscalQuarter");
        const label = `${year}-${firstMonth}`;
        expect(last.month, label).toBe(firstMonth + 2);
        expect(last.day, label).toBe(last.daysInMonth);
        expect(last.startOf("fiscalQuarter"), label).toEqual(first);
        expect(first.range("fiscalQuarter"), label).toEqual(NepaliDate.rangeBetween(first, last));
        expect(first.adRange("fiscalQuarter"), label).toEqual(
          NepaliDate.adRangeBetween(first, last),
        );
        if (previous) expect(previous.addDays(1), label).toEqual(first);
        previous = last;
      }
      if (year < LAST_YEAR) {
        // A whole fiscal year runs from the start of its Q1 to the end of its Q4.
        const shrawan1 = new NepaliDate(year, 4, 1);
        expect(shrawan1.startOf("fiscalYear"), String(year)).toEqual(
          shrawan1.startOf("fiscalQuarter"),
        );
        expect(shrawan1.endOf("fiscalYear"), String(year)).toEqual(
          new NepaliDate(year + 1, 1, 1).endOf("fiscalQuarter"),
        );
      }
    }
    expect(previous).toEqual(NepaliDate.MAX_DATE);
  });

  it("works at both ends of the table, where fiscal years don't", () => {
    expect(NepaliDate.MIN_DATE.fiscalQuarter()).toBe(4);
    expect(NepaliDate.MIN_DATE.startOf("fiscalQuarter")).toEqual(NepaliDate.MIN_DATE);
    expect(NepaliDate.MIN_DATE.range("fiscalQuarter").start).toEqual(
      NepaliDate.MIN_DATE.startInstant(),
    );
    expect(NepaliDate.MAX_DATE.fiscalQuarter()).toBe(3);
    expect(NepaliDate.MAX_DATE.endOf("fiscalQuarter")).toEqual(NepaliDate.MAX_DATE);
    expect(NepaliDate.MAX_DATE.range("fiscalQuarter").end.toISOString()).toBe(
      "2030-04-13T18:15:00.000Z",
    );
    expect(NepaliDate.MAX_DATE.adRange("fiscalQuarter").end).toBe("2030-04-14");
  });

  it("compares with isSame", () => {
    const bs = NepaliDate.parse;
    expect(bs("2083-04-01").isSame(bs("2083-06-31"), "fiscalQuarter")).toBe(true);
    expect(bs("2083-06-31").isSame(bs("2083-07-01"), "fiscalQuarter")).toBe(false);
    expect(bs("2083-03-32").isSame(bs("2083-04-01"), "fiscalQuarter")).toBe(false);
    expect(bs("2083-12-30").isSame(bs("2084-01-01"), "fiscalQuarter")).toBe(false);
    // The same quarter number in another fiscal year is another quarter.
    expect(bs("2083-04-01").isSame(bs("2084-04-01"), "fiscalQuarter")).toBe(false);
  });
});

describe("serialization", () => {
  it("writes YYYY-MM-DD with a zero-padded month and day", () => {
    expect(new NepaliDate(2083, 6, 26).toString()).toBe("2083-06-26");
    expect(new NepaliDate(2083, 1, 5).toString()).toBe("2083-01-05");
    expect(new NepaliDate(2083, 12, 30).toString()).toBe("2083-12-30");
  });

  it("serializes to a plain string in JSON", () => {
    const d = new NepaliDate(2083, 6, 26);
    expect(JSON.stringify(d)).toBe('"2083-06-26"');
    expect(JSON.stringify({ date: d })).toBe('{"date":"2083-06-26"}');
    expect(JSON.stringify([d, NepaliDate.MIN_DATE])).toBe('["2083-06-26","1975-01-01"]');
  });

  it("does not expose internal fields in JSON", () => {
    expect(JSON.stringify({ date: new NepaliDate(2083, 6, 26) })).not.toContain("days");
  });

  it("restores dates from JSON with parse as a reviver", () => {
    const json = JSON.stringify({ date: new NepaliDate(2083, 6, 26) });
    const restored = JSON.parse(json, (key: string, value: unknown) =>
      key === "date" ? NepaliDate.parse(value as string) : value,
    ) as { date: NepaliDate };
    expect(restored.date).toBeInstanceOf(NepaliDate);
    expect(restored.date.toString()).toBe("2083-06-26");
  });
});

describe("NepaliDate.parse", () => {
  it("reads YYYY-MM-DD", () => {
    const d = NepaliDate.parse("2083-06-26");
    expect([d.year, d.month, d.day]).toEqual([2083, 6, 26]);
  });

  it("round-trips every day in the table", () => {
    for (let days = 0; days < TOTAL_DAYS; days++) {
      const text = NepaliDate.fromDays(days).toString();
      if (NepaliDate.parse(text).toString() !== text) {
        expect.fail(`parse(${JSON.stringify(text)}) did not return the same date`);
      }
    }
  });

  it.each([
    ["2083-06-26", "2083-06-26"],
    ["2083/06/26", "2083-06-26"],
    ["2083.06.26", "2083-06-26"],
    ["2083-6-26", "2083-06-26"], // month not zero-padded
    ["2083/6/5", "2083-06-05"], // neither padded
    ["2083.12.30", "2083-12-30"],
    ["2083 06 26", "2083-06-26"], // single spaces
    ["2083 6 5", "2083-06-05"],
    ["२०८३ ०६ २६", "2083-06-26"], // Devanagari digits with spaces
    ["२०८३-०६-२६", "2083-06-26"], // Devanagari digits
  ])("accepts %j", (text, expected) => {
    expect(NepaliDate.parse(text).toString()).toBe(expected);
  });

  it.each([
    "83-06-26", // 2-digit year
    "02083-06-26", // 5-digit year
    "2083-006-26", // 3-digit month
    "2083-06/26", // mixed separators
    "2083/06.26",
    "2083 06-26", // a space mixed with another separator
    "2083  06  26", // more than one space
    "2083\t06\t26", // tabs
    "2083_06_26",
    "20830626", // no separators
    "26-06-2083", // day first
    "26/06/2083",
    " 2083-06-26", // surrounding whitespace
    "2083-06-26 ",
    "2083-06-26T00:00:00Z", // timestamp
    "٢٠٨٣-٠٦-٢٦", // Arabic-Indic digits: only 0–9 and Devanagari are read
    "",
    "not a date",
  ])("rejects the format %j", (text) => {
    expect(() => NepaliDate.parse(text)).toThrow(RangeError);
  });

  it.each([
    "2083-06-32", // Aswin 2083 has 31 days
    "2083-13-01", // no month 13
    "2083-00-10", // no month 0
    "2083-06-00", // no day 0
    "1974-12-30", // before the table
    "2087-01-01", // after the table
  ])("rejects the impossible date %j", (text) => {
    expect(() => NepaliDate.parse(text)).toThrow(RangeError);
  });
});

describe("BS ↔ AD round trip", () => {
  it("converts every day in the table BS → AD → BS, on consecutive AD days with matching weekdays", () => {
    // Walk the BS calendar with daysInMonth and the AD calendar with Date, side by side.
    const iso = (y: number, m: number, d: number) =>
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const start = NepaliDate.MIN_DATE.toAd();
    const ad = new Date(Date.UTC(start.year, start.month - 1, start.day));
    let count = 0;

    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      for (let month = 1; month <= 12; month++) {
        const length = NepaliDate.daysInMonth(year, month);
        for (let day = 1; day <= length; day++) {
          const bs = new NepaliDate(year, month, day);
          const converted = bs.toAd();
          const expectedAd = iso(ad.getUTCFullYear(), ad.getUTCMonth() + 1, ad.getUTCDate());
          const actualAd = iso(converted.year, converted.month, converted.day);
          const back = NepaliDate.fromAd(converted.year, converted.month, converted.day);

          if (
            actualAd !== expectedAd ||
            back.toString() !== bs.toString() ||
            bs.dayOfWeek !== ad.getUTCDay()
          ) {
            expect.fail(
              `BS ${bs.toString()} → AD ${actualAd} (expected ${expectedAd}) → BS ${back.toString()}, ` +
                `weekday ${bs.dayOfWeek} (expected ${ad.getUTCDay()})`,
            );
          }
          ad.setUTCDate(ad.getUTCDate() + 1);
          count++;
        }
      }
    }

    expect(count).toBe(TOTAL_DAYS);
  });
});

describe("NepaliDate.fromInstant", () => {
  // Kartik 1, 2083 starts at 2026-10-18 00:00 in Kathmandu, which is 2026-10-17T18:15Z.
  const KARTIK_1_START = Date.UTC(2026, 9, 17, 18, 15);

  it("gives the date in Nepal for a Date, epoch ms or ISO string", () => {
    for (const instant of [
      new Date(KARTIK_1_START),
      KARTIK_1_START,
      "2026-10-17T18:15:00Z",
      "2026-10-17T18:15Z",
      "2026-10-17T18:15:00.000Z",
      "2026-10-18T00:00:00+05:45",
      "2026-10-17T14:15:00-04:00",
    ]) {
      expect(NepaliDate.fromInstant(instant).toString(), String(instant)).toBe("2083-07-01");
    }
  });

  it("changes date at midnight in Nepal, not UTC", () => {
    expect(NepaliDate.fromInstant(KARTIK_1_START - 1).toString()).toBe("2083-06-31");
    expect(NepaliDate.fromInstant("2026-10-17T23:59:59+05:45").toString()).toBe("2083-06-31");
    expect(NepaliDate.fromInstant("2026-10-18T23:59:59Z").toString()).toBe("2083-07-02");
  });

  it("uses +05:30 before 1986", () => {
    expect(NepaliDate.fromInstant("1985-12-30T18:29:59Z").toAdString()).toBe("1985-12-30");
    expect(NepaliDate.fromInstant("1985-12-30T18:30:00Z").toAdString()).toBe("1985-12-31");
  });

  it("covers the first and last instant of the table", () => {
    expect(NepaliDate.fromInstant("1918-04-12T18:18:44Z")).toEqual(NepaliDate.MIN_DATE);
    expect(NepaliDate.fromInstant("2030-04-13T18:14:59.999Z")).toEqual(NepaliDate.MAX_DATE);
  });

  it("rejects instants outside the table", () => {
    expect(() => NepaliDate.fromInstant("1918-04-12T18:18:43.999Z")).toThrow(RangeError);
    expect(() => NepaliDate.fromInstant("2030-04-13T18:15:00Z")).toThrow(RangeError);
  });

  it("rejects strings without a time zone, pointing calendar dates to fromAd", () => {
    expect(() => NepaliDate.fromInstant("2026-10-18T10:00:00")).toThrow(RangeError);
    expect(() => NepaliDate.fromInstant("2026-10-18")).toThrow(/NepaliDate\.fromAd/);
    expect(() => NepaliDate.fromInstant("Sun Oct 18 2026")).toThrow(RangeError);
  });

  it("rejects invalid instants", () => {
    expect(() => NepaliDate.fromInstant(new Date("nope"))).toThrow(RangeError);
    expect(() => NepaliDate.fromInstant(Number.NaN)).toThrow(RangeError);
    expect(() => NepaliDate.fromInstant(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => NepaliDate.fromInstant(1e20)).toThrow(RangeError);
    expect(() => NepaliDate.fromInstant("2026-13-01T00:00:00Z")).toThrow(RangeError);
  });
});

describe("NepaliDate.today", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("changes date at 18:15 UTC, midnight in Nepal", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-17T18:14:59Z"));
    expect(NepaliDate.today().toString()).toBe("2083-06-31");
    vi.setSystemTime(new Date("2026-10-17T18:15:00Z"));
    expect(NepaliDate.today().toString()).toBe("2083-07-01");
  });

  it("throws after the last supported date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-04-13T18:15:00Z"));
    expect(() => NepaliDate.today()).toThrow(RangeError);
  });
});

describe("offsetMinutes option", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("changes date at UTC midnight with offset 0", () => {
    expect(NepaliDate.fromInstant("2026-10-17T23:59:59Z", { offsetMinutes: 0 }).toString()).toBe(
      "2083-06-31",
    );
    expect(NepaliDate.fromInstant("2026-10-18T00:00:00Z", { offsetMinutes: 0 }).toString()).toBe(
      "2083-07-01",
    );
  });

  it("supports offsets west of UTC", () => {
    // -04:00 (New York in summer): 2026-10-18 starts at 04:00 UTC.
    const newYork = { offsetMinutes: -240 };
    expect(NepaliDate.fromInstant("2026-10-18T03:59:59Z", newYork).toString()).toBe("2083-06-31");
    expect(NepaliDate.fromInstant("2026-10-18T04:00:00Z", newYork).toString()).toBe("2083-07-01");
  });

  it("uses the fixed offset even where Nepal's offset was different", () => {
    // Nepal was +05:30 in 1985, so 18:20 UTC was still 30 December there.
    expect(NepaliDate.fromInstant("1985-12-30T18:20:00Z").toAdString()).toBe("1985-12-30");
    expect(
      NepaliDate.fromInstant("1985-12-30T18:20:00Z", { offsetMinutes: 345 }).toAdString(),
    ).toBe("1985-12-31");
  });

  it("uses Nepal's offset when options are empty", () => {
    expect(NepaliDate.fromInstant("2026-10-17T18:15:00Z", {}).toString()).toBe("2083-07-01");
  });

  it("applies to today()", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-17T20:00:00Z"));
    expect(NepaliDate.today().toString()).toBe("2083-07-01");
    expect(NepaliDate.today({ offsetMinutes: 0 }).toString()).toBe("2083-06-31");
  });

  it("checks the range at the given offset", () => {
    // The first supported AD date is 1918-04-13, which starts at 1918-04-13T00:00Z in UTC.
    expect(NepaliDate.fromInstant("1918-04-13T00:00:00Z", { offsetMinutes: 0 })).toEqual(
      NepaliDate.MIN_DATE,
    );
    expect(() => NepaliDate.fromInstant("1918-04-12T23:59:59Z", { offsetMinutes: 0 })).toThrow(
      /falls on AD 1918-04-12, outside the supported range 1918-04-13 to 2030-04-13/,
    );
  });

  it("rejects offsets that aren't whole minutes within a day", () => {
    for (const offsetMinutes of [5.75, Number.NaN, Number.POSITIVE_INFINITY, 1440, -1440]) {
      expect(() => NepaliDate.fromInstant(0, { offsetMinutes }), String(offsetMinutes)).toThrow(
        /offsetMinutes must be a whole number/,
      );
    }
  });
});

describe("startInstant", () => {
  it("gives midnight in Kathmandu as a UTC Date", () => {
    const start = new NepaliDate(2083, 7, 1).startInstant();
    expect(start).toBeInstanceOf(Date);
    expect(start.toISOString()).toBe("2026-10-17T18:15:00.000Z");
  });

  it("uses +05:30 before 1986 and local mean time before 1920", () => {
    expect(NepaliDate.fromAd(1985, 12, 31).startInstant().toISOString()).toBe(
      "1985-12-30T18:30:00.000Z",
    );
    expect(NepaliDate.MIN_DATE.startInstant().toISOString()).toBe("1918-04-12T18:18:44.000Z");
  });

  it("starts 1986-01-01 at 00:15, as 00:00–00:14 never existed", () => {
    expect(NepaliDate.fromAd(1986, 1, 1).startInstant().toISOString()).toBe(
      "1985-12-31T18:30:00.000Z",
    );
  });

  it("is the first moment of the date for every day in the table", () => {
    for (let days = 0; days < TOTAL_DAYS; days++) {
      const date = NepaliDate.fromDays(days);
      const start = date.startInstant().getTime();
      const sameDay = NepaliDate.fromInstant(start).toString() === date.toString();
      const dayBefore =
        days === 0 || NepaliDate.fromInstant(start - 1).toString() !== date.toString();
      if (!sameDay || !dayBefore) {
        expect.fail(`${date.toString()} starts at ${new Date(start).toISOString()}`);
      }
    }
  });

  it("gives midnight at a fixed offset when given one", () => {
    const date = new NepaliDate(2083, 7, 1); // AD 2026-10-18
    expect(date.startInstant({ offsetMinutes: 0 }).toISOString()).toBe("2026-10-18T00:00:00.000Z");
    expect(date.startInstant({ offsetMinutes: -240 }).toISOString()).toBe(
      "2026-10-18T04:00:00.000Z",
    );
    expect(() => date.startInstant({ offsetMinutes: 5.75 })).toThrow(RangeError);
  });

  it("returns a new Date every time, so changing one doesn't affect the date", () => {
    const date = new NepaliDate(2083, 7, 1);
    date.startInstant().setUTCFullYear(2000);
    expect(date.startInstant().toISOString()).toBe("2026-10-17T18:15:00.000Z");
  });
});

describe("range", () => {
  const iso = ({ start, end }: { start: Date; end: Date }) => [
    start.toISOString(),
    end.toISOString(),
  ];

  it("gives a day from midnight to the next midnight in Kathmandu", () => {
    expect(iso(new NepaliDate(2083, 7, 1).range("day"))).toEqual([
      "2026-10-17T18:15:00.000Z",
      "2026-10-18T18:15:00.000Z",
    ]);
  });

  it("gives the whole month for any day in it", () => {
    const kartik = ["2026-10-17T18:15:00.000Z", "2026-11-16T18:15:00.000Z"];
    expect(iso(new NepaliDate(2083, 7, 1).range("month"))).toEqual(kartik);
    expect(iso(new NepaliDate(2083, 7, 15).range("month"))).toEqual(kartik);
    expect(iso(new NepaliDate(2083, 7, 30).range("month"))).toEqual(kartik);
  });

  it("covers all 32 days of a 32-day month", () => {
    expect(iso(new NepaliDate(2083, 3, 32).range("month"))).toEqual([
      "2026-06-14T18:15:00.000Z",
      "2026-07-16T18:15:00.000Z",
    ]);
  });

  it("gives the whole year from Baisakh 1 to the next Baisakh 1", () => {
    expect(iso(new NepaliDate(2083, 7, 1).range("year"))).toEqual([
      "2026-04-13T18:15:00.000Z",
      "2027-04-13T18:15:00.000Z",
    ]);
  });

  it("uses each end's own offset across the 1986 change", () => {
    // BS 2042 started at +05:30 and ended at +05:45.
    expect(iso(new NepaliDate(2042, 2, 19).range("year"))).toEqual([
      "1985-04-12T18:30:00.000Z",
      "1986-04-13T18:15:00.000Z",
    ]);
  });

  it("works for the last day, month and year in the table", () => {
    const end = "2030-04-13T18:15:00.000Z";
    expect(NepaliDate.MAX_DATE.range("day").end.toISOString()).toBe(end);
    expect(NepaliDate.MAX_DATE.range("month").end.toISOString()).toBe(end);
    expect(NepaliDate.MAX_DATE.range("year").end.toISOString()).toBe(end);
  });

  it("covers exactly the days of every month and year in the table, with no gaps", () => {
    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      const yearRange = new NepaliDate(year, 1, 1).range("year");
      let expectedStart = yearRange.start.getTime();
      for (let month = 1; month <= 12; month++) {
        const last = NepaliDate.daysInMonth(year, month);
        const { start, end } = new NepaliDate(year, month, 1).range("month");
        const label = `${year}-${month}`;
        expect(start.getTime(), label).toBe(expectedStart);
        expect(NepaliDate.fromInstant(start).toString(), label).toBe(
          new NepaliDate(year, month, 1).toString(),
        );
        expect(NepaliDate.fromInstant(end.getTime() - 1).toString(), label).toBe(
          new NepaliDate(year, month, last).toString(),
        );
        expectedStart = end.getTime();
      }
      expect(yearRange.end.getTime(), String(year)).toBe(expectedStart);
    }
  });

  it("uses midnight at a fixed offset when given one", () => {
    const date = new NepaliDate(2083, 7, 1); // AD 2026-10-18
    expect(iso(date.range("day", { offsetMinutes: 0 }))).toEqual([
      "2026-10-18T00:00:00.000Z",
      "2026-10-19T00:00:00.000Z",
    ]);
    expect(() => date.range("day", { offsetMinutes: 5.75 })).toThrow(RangeError);
  });

  it("rejects unknown units", () => {
    expect(() => new NepaliDate(2083, 7, 1).range("quarter" as never)).toThrow(
      /unit must be "day", "week", "month", "fiscalQuarter", "year" or "fiscalYear", got "quarter"/,
    );
  });
});

describe("NepaliDate.rangeBetween", () => {
  const iso = ({ start, end }: { start: Date; end: Date }) => [
    start.toISOString(),
    end.toISOString(),
  ];
  const kartik = (day: number) => new NepaliDate(2083, 7, day);

  it("includes both the first and the last day", () => {
    // Kartik 1–15, 2083 is AD 2026-10-18 to 2026-11-01.
    expect(iso(NepaliDate.rangeBetween(kartik(1), kartik(15)))).toEqual([
      "2026-10-17T18:15:00.000Z",
      "2026-11-01T18:15:00.000Z",
    ]);
  });

  it("matches range() for a single day and a whole month", () => {
    expect(NepaliDate.rangeBetween(kartik(5), kartik(5))).toEqual(kartik(5).range("day"));
    expect(NepaliDate.rangeBetween(kartik(1), kartik(30))).toEqual(kartik(1).range("month"));
  });

  it("spans years and Nepal's 1986 offset change", () => {
    const from = NepaliDate.fromAd(1985, 12, 1);
    const to = NepaliDate.fromAd(1986, 1, 31);
    expect(iso(NepaliDate.rangeBetween(from, to))).toEqual([
      "1985-11-30T18:30:00.000Z",
      "1986-01-31T18:15:00.000Z",
    ]);
  });

  it("covers the whole table", () => {
    expect(iso(NepaliDate.rangeBetween(NepaliDate.MIN_DATE, NepaliDate.MAX_DATE))).toEqual([
      "1918-04-12T18:18:44.000Z",
      "2030-04-13T18:15:00.000Z",
    ]);
  });

  it("uses midnight at a fixed offset when given one", () => {
    expect(iso(NepaliDate.rangeBetween(kartik(1), kartik(2), { offsetMinutes: 0 }))).toEqual([
      "2026-10-18T00:00:00.000Z",
      "2026-10-20T00:00:00.000Z",
    ]);
  });

  it("rejects a range that ends before it starts", () => {
    expect(() => NepaliDate.rangeBetween(kartik(15), kartik(1))).toThrow(
      /from on or before to, got 2083-07-15 and 2083-07-01/,
    );
  });

  it("rejects anything but NepaliDate instances", () => {
    expect(() => NepaliDate.rangeBetween("2083-07-01" as never, kartik(15))).toThrow(TypeError);
    expect(() =>
      NepaliDate.rangeBetween(kartik(1), { year: 2083, month: 7, day: 15 } as never),
    ).toThrow(TypeError);
  });
});

describe("range formats", () => {
  const date = new NepaliDate(2083, 7, 1);
  const START = "2026-10-17T18:15:00.000Z";
  const END = "2026-10-18T18:15:00.000Z";

  it("gives Dates by default and for as: date", () => {
    for (const range of [date.range("day"), date.range("day", { as: "date" })]) {
      expect(range.start).toBeInstanceOf(Date);
      expect(range.start.toISOString()).toBe(START);
      expect(range.end.toISOString()).toBe(END);
    }
  });

  it("gives ISO strings in UTC for as: iso", () => {
    expect(date.range("day", { as: "iso" })).toEqual({ start: START, end: END });
  });

  it("gives epoch milliseconds for as: ms", () => {
    expect(date.range("day", { as: "ms" })).toEqual({
      start: Date.parse(START),
      end: Date.parse(END),
    });
  });

  it("works with rangeBetween and offsetMinutes", () => {
    expect(NepaliDate.rangeBetween(date, date, { as: "iso", offsetMinutes: 0 })).toEqual({
      start: "2026-10-18T00:00:00.000Z",
      end: "2026-10-19T00:00:00.000Z",
    });
  });

  it("rejects unknown formats", () => {
    expect(() => date.range("day", { as: "sql" as never })).toThrow(
      /as must be "date", "iso" or "ms", got "sql"/,
    );
  });

  it("tells TypeScript the type of each format", () => {
    expectTypeOf(date.range("day")).toEqualTypeOf<InstantRange<Date>>();
    expectTypeOf(date.range("day", { offsetMinutes: 0 })).toEqualTypeOf<InstantRange<Date>>();
    expectTypeOf(date.range("day", { as: "iso" })).toEqualTypeOf<InstantRange<string>>();
    expectTypeOf(date.range("month", { as: "ms" })).toEqualTypeOf<InstantRange<number>>();
    expectTypeOf(NepaliDate.rangeBetween(date, date, { as: "ms" })).toEqualTypeOf<
      InstantRange<number>
    >();
  });
});

describe("adRange", () => {
  it("gives the AD dates of a month, ending on the day after it", () => {
    expect(new NepaliDate(2083, 6, 10).adRange("month")).toEqual({
      start: "2026-09-17",
      end: "2026-10-18",
    });
  });

  it("gives a day and a year", () => {
    const date = new NepaliDate(2083, 7, 1);
    expect(date.adRange("day")).toEqual({ start: "2026-10-18", end: "2026-10-19" });
    expect(date.adRange("year")).toEqual({ start: "2026-04-14", end: "2027-04-14" });
  });

  it("ends the last period in the table on the day after it", () => {
    const end = "2030-04-14";
    expect(NepaliDate.MAX_DATE.adRange("day")).toEqual({ start: "2030-04-13", end });
    expect(NepaliDate.MAX_DATE.adRange("year").end).toBe(end);
  });

  it("matches the AD dates of every month's first day, back to back", () => {
    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      for (let month = 1; month <= 12; month++) {
        const range = new NepaliDate(year, month, 1).adRange("month");
        expect(range.start, `${year}-${month}`).toBe(new NepaliDate(year, month, 1).toAdString());
        if (year < LAST_YEAR || month < 12) {
          const next =
            month === 12 ? new NepaliDate(year + 1, 1, 1) : new NepaliDate(year, month + 1, 1);
          expect(range.end, `${year}-${month}`).toBe(next.toAdString());
        }
      }
    }
  });

  it("gives the same dates as a UTC range, without the times", () => {
    const date = new NepaliDate(2083, 7, 1);
    const utc = date.range("month", { as: "iso", offsetMinutes: 0 });
    expect(date.adRange("month")).toEqual({
      start: utc.start.slice(0, 10),
      end: utc.end.slice(0, 10),
    });
  });

  it("rejects unknown units", () => {
    expect(() => new NepaliDate(2083, 7, 1).adRange("quarter" as never)).toThrow(RangeError);
  });
});

describe("NepaliDate.adRangeBetween", () => {
  const kartik = (day: number) => new NepaliDate(2083, 7, day);

  it("includes both days, ending on the AD date after the last", () => {
    expect(NepaliDate.adRangeBetween(kartik(1), kartik(15))).toEqual({
      start: "2026-10-18",
      end: "2026-11-02",
    });
  });

  it("matches adRange for a single day and a whole month", () => {
    expect(NepaliDate.adRangeBetween(kartik(5), kartik(5))).toEqual(kartik(5).adRange("day"));
    expect(NepaliDate.adRangeBetween(kartik(1), kartik(30))).toEqual(kartik(1).adRange("month"));
  });

  it("rejects a reversed range and anything but NepaliDate instances", () => {
    expect(() => NepaliDate.adRangeBetween(kartik(15), kartik(1))).toThrow(
      /adRangeBetween needs from on or before to/,
    );
    expect(() => NepaliDate.adRangeBetween("2083-07-01" as never, kartik(15))).toThrow(TypeError);
  });
});
