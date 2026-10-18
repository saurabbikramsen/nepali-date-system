import { inspect } from "node:util";
import { describe, expect, it } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { FIRST_YEAR, LAST_YEAR } from "../src/defined.js";
import { NepaliDate } from "../src/nepali-date.js";

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
  it.each(["2026-10-12", "2026/10/12", "2026.10.12"])("reads %j", (text) => {
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
  ])("accepts %j", (text, expected) => {
    expect(NepaliDate.parse(text).toString()).toBe(expected);
  });

  it.each([
    "83-06-26", // 2-digit year
    "02083-06-26", // 5-digit year
    "2083-006-26", // 3-digit month
    "2083-06/26", // mixed separators
    "2083/06.26",
    "2083 06 26", // unsupported separator
    "2083_06_26",
    "20830626", // no separators
    "26-06-2083", // day first
    "26/06/2083",
    " 2083-06-26", // surrounding whitespace
    "2083-06-26 ",
    "2083-06-26T00:00:00Z", // timestamp
    "२०८३-०६-२६", // Devanagari digits
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
