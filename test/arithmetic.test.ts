import { describe, expect, it } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { FIRST_YEAR, LAST_YEAR } from "../src/defined.js";
import { fromDays, NepaliDate } from "../src/nepali-date.js";

const bs = (text: string) => NepaliDate.parse(text);

/** The AD date `days` days after an AD date string, using Date in UTC. */
function adPlus(ad: string, days: number): string {
  const [year, month, day] = ad.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

describe("addDays", () => {
  it("moves forward and back within a month", () => {
    expect(bs("2083-07-01").addDays(14).toString()).toBe("2083-07-15");
    expect(bs("2083-07-15").addDays(-14).toString()).toBe("2083-07-01");
  });

  it("crosses month ends, including 29-, 30-, 31- and 32-day months", () => {
    expect(bs("2083-06-31").addDays(1).toString()).toBe("2083-07-01"); // Aswin has 31 days
    expect(bs("2083-03-31").addDays(1).toString()).toBe("2083-03-32"); // Asar has 32
    expect(bs("2083-03-32").addDays(1).toString()).toBe("2083-04-01");
    expect(bs("2083-08-29").addDays(1).toString()).toBe("2083-09-01"); // Mangsir has 29
    expect(bs("2083-07-01").addDays(-1).toString()).toBe("2083-06-31");
  });

  it("crosses year ends", () => {
    expect(bs("2083-12-30").addDays(1).toString()).toBe("2084-01-01");
    expect(bs("2084-01-01").addDays(-1).toString()).toBe("2083-12-30");
    expect(bs("2083-01-01").addDays(365).toString()).toBe("2084-01-01"); // 2083 has 365 days
  });

  it("returns an equal date for 0 and leaves the original unchanged", () => {
    const date = bs("2083-07-01");
    expect(date.addDays(0)).toEqual(date);
    date.addDays(10);
    expect(date.toString()).toBe("2083-07-01");
  });

  it("matches AD date arithmetic for every day in the table", () => {
    for (let days = 0; days < TOTAL_DAYS - 1; days++) {
      const date = fromDays(days);
      const next = date.addDays(1);
      if (
        next.toAdString() !== adPlus(date.toAdString(), 1) ||
        next.addDays(-1).toString() !== date.toString()
      ) {
        expect.fail(`${date} + 1 day gave ${next}`);
      }
    }
  });

  it("moves the weekday along with the date", () => {
    const sunday = bs("2083-07-01");
    for (let n = -20; n <= 20; n++) {
      expect(sunday.addDays(n).dayOfWeek, String(n)).toBe(((n % 7) + 7) % 7);
    }
  });

  it("reaches both ends of the table", () => {
    expect(NepaliDate.MIN_DATE.addDays(TOTAL_DAYS - 1)).toEqual(NepaliDate.MAX_DATE);
    expect(NepaliDate.MAX_DATE.addDays(-(TOTAL_DAYS - 1))).toEqual(NepaliDate.MIN_DATE);
  });

  it("rejects results outside the table", () => {
    expect(() => NepaliDate.MAX_DATE.addDays(1)).toThrow(
      /2086-12-30 plus 1 day is outside the supported range 1975-01-01 to 2086-12-30/,
    );
    expect(() => NepaliDate.MIN_DATE.addDays(-1)).toThrow(/plus -1 day is outside/);
    expect(() => NepaliDate.MIN_DATE.addDays(-5)).toThrow(/plus -5 days is outside/);
    expect(() => bs("2083-07-01").addDays(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
  });

  it("rejects amounts that aren't whole numbers", () => {
    for (const amount of [1.5, Number.NaN, Number.POSITIVE_INFINITY, "1", undefined]) {
      expect(() => bs("2083-07-01").addDays(amount as never), String(amount)).toThrow(
        /days must be a whole number/,
      );
    }
  });
});

describe("addWeeks", () => {
  it("moves by seven days and keeps the weekday", () => {
    const date = bs("2083-07-01"); // a Sunday
    expect(date.addWeeks(1).toString()).toBe("2083-07-08");
    expect(date.addWeeks(-2).toString()).toBe("2083-06-18"); // Aswin has 31 days
    expect(date.addWeeks(10).dayOfWeek).toBe(0);
  });

  it("matches addDays with seven times the amount", () => {
    const date = bs("2083-07-01");
    for (let weeks = -60; weeks <= 60; weeks++) {
      expect(date.addWeeks(weeks), String(weeks)).toEqual(date.addDays(weeks * 7));
    }
  });

  it("rejects results outside the table and amounts that aren't whole numbers", () => {
    expect(() => NepaliDate.MAX_DATE.addWeeks(1)).toThrow(/plus 1 week is outside/);
    expect(() => bs("2083-07-01").addWeeks(0.5)).toThrow(/weeks must be a whole number, got 0.5/);
  });
});

describe("addMonths", () => {
  it("keeps the day when the new month is long enough", () => {
    expect(bs("2083-07-15").addMonths(1).toString()).toBe("2083-08-15");
    expect(bs("2083-07-15").addMonths(-3).toString()).toBe("2083-04-15");
  });

  it("moves to the last day when the new month is shorter", () => {
    // The roadmap's example: Bhadra 2056 has 32 days, Aswin 2056 has 30.
    expect(bs("2056-05-32").addMonths(1).toString()).toBe("2056-06-30");
    expect(bs("2083-07-30").addMonths(1).toString()).toBe("2083-08-29"); // Mangsir has 29
    expect(bs("2083-03-32").addMonths(-1).toString()).toBe("2083-02-31"); // Jestha has 31
  });

  it("crosses year ends in both directions", () => {
    expect(bs("2083-12-15").addMonths(1).toString()).toBe("2084-01-15");
    expect(bs("2083-01-15").addMonths(-1).toString()).toBe("2082-12-15");
    expect(bs("2083-07-15").addMonths(25).toString()).toBe("2085-08-15");
    expect(bs("2083-07-15").addMonths(-25).toString()).toBe("2081-06-15");
  });

  it("doesn't undo itself after moving to a shorter month", () => {
    expect(bs("2056-05-32").addMonths(1).addMonths(-1).toString()).toBe("2056-05-30");
  });

  it("gives the next month and the right day for every day in the table", () => {
    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      for (let month = 1; month <= 12; month++) {
        if (year === LAST_YEAR && month === 12) continue;
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextLength = NepaliDate.daysInMonth(nextYear, nextMonth);
        for (let day = 1; day <= NepaliDate.daysInMonth(year, month); day++) {
          const result = new NepaliDate(year, month, day).addMonths(1);
          if (
            result.year !== nextYear ||
            result.month !== nextMonth ||
            result.day !== Math.min(day, nextLength)
          ) {
            expect.fail(`${year}-${month}-${day} + 1 month gave ${result}`);
          }
        }
      }
    }
  });

  it("returns an equal date for 0 and leaves the original unchanged", () => {
    const date = bs("2083-07-01");
    expect(date.addMonths(0)).toEqual(date);
    date.addMonths(3);
    expect(date.toString()).toBe("2083-07-01");
  });

  it("rejects results outside the table and amounts that aren't whole numbers", () => {
    expect(() => NepaliDate.MAX_DATE.addMonths(1)).toThrow(
      /2086-12-30 plus 1 month is outside the supported range/,
    );
    expect(() => NepaliDate.MIN_DATE.addMonths(-1)).toThrow(/plus -1 month is outside/);
    expect(() => bs("2083-07-01").addMonths(1.5)).toThrow(/months must be a whole number/);
    expect(() => bs("2083-07-01").addMonths(Number.NaN)).toThrow(/months must be a whole number/);
  });
});

describe("addYears", () => {
  it("keeps the month and day when they exist", () => {
    expect(bs("2083-07-15").addYears(1).toString()).toBe("2084-07-15");
    expect(bs("2083-07-15").addYears(-10).toString()).toBe("2073-07-15");
  });

  it("moves to the month's last day when the new year's month is shorter", () => {
    // Asar has 32 days in 2082 but 31 in 2081.
    expect(bs("2082-03-32").addYears(-1).toString()).toBe("2081-03-31");
  });

  it("matches addMonths with twelve times the amount", () => {
    const date = bs("2056-05-32");
    for (let years = -50; years <= 30; years++) {
      expect(date.addYears(years), String(years)).toEqual(date.addMonths(years * 12));
    }
  });

  it("reaches the first and last years of the table", () => {
    expect(bs("2083-07-01").addYears(FIRST_YEAR - 2083).year).toBe(FIRST_YEAR);
    expect(bs("2083-07-01").addYears(LAST_YEAR - 2083).year).toBe(LAST_YEAR);
  });

  it("rejects results outside the table and amounts that aren't whole numbers", () => {
    expect(() => bs("2083-07-01").addYears(LAST_YEAR - 2083 + 1)).toThrow(
      /plus 4 years is outside the supported range/,
    );
    expect(() => bs("2083-07-01").addYears(-200)).toThrow(/plus -200 years is outside/);
    expect(() => bs("2083-07-01").addYears(0.5)).toThrow(/years must be a whole number/);
  });
});

describe("startOf and endOf", () => {
  it("give the first and last day of the month", () => {
    const date = bs("2083-07-15"); // Kartik has 30 days in 2083
    expect(date.startOf("month").toString()).toBe("2083-07-01");
    expect(date.endOf("month").toString()).toBe("2083-07-30");
  });

  it("follow each month's own length", () => {
    expect(bs("2083-03-10").endOf("month").toString()).toBe("2083-03-32"); // Asar: 32
    expect(bs("2083-08-10").endOf("month").toString()).toBe("2083-08-29"); // Mangsir: 29
    expect(bs("2056-05-01").endOf("month").toString()).toBe("2056-05-32"); // Bhadra 2056: 32
  });

  it("give Baisakh 1 and the last day of Chaitra for the year", () => {
    const date = bs("2083-07-15");
    expect(date.startOf("year").toString()).toBe("2083-01-01");
    expect(date.endOf("year").toString()).toBe("2083-12-30");
  });

  it("give the same date for day", () => {
    const date = bs("2083-07-15");
    expect(date.startOf("day")).toEqual(date);
    expect(date.endOf("day")).toEqual(date);
  });

  it("cover every month and year in the table back to back", () => {
    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      const yearStart = new NepaliDate(year, 1, 1);
      expect(new NepaliDate(year, 6, 15).startOf("year"), String(year)).toEqual(yearStart);
      for (let month = 1; month <= 12; month++) {
        const length = NepaliDate.daysInMonth(year, month);
        const date = new NepaliDate(year, month, Math.ceil(length / 2));
        const start = date.startOf("month");
        const end = date.endOf("month");
        if (start.day !== 1 || end.day !== length || end.month !== month || end.year !== year) {
          expect.fail(`${date}: startOf ${start}, endOf ${end}`);
        }
        if (year < LAST_YEAR || month < 12) {
          expect(end.addDays(1).day, `${year}-${month}`).toBe(1);
        }
      }
      if (year < LAST_YEAR) {
        expect(yearStart.endOf("year").addDays(1), String(year)).toEqual(
          new NepaliDate(year + 1, 1, 1),
        );
      }
    }
  });

  it("agree with range", () => {
    const date = bs("2083-07-15");
    for (const unit of [
      "day",
      "month",
      "fiscalQuarter",
      "chaumasik",
      "year",
      "fiscalYear",
    ] as const) {
      const { start, end } = date.range(unit);
      expect(date.startOf(unit).startInstant(), unit).toEqual(start);
      expect(date.endOf(unit).addDays(1).startInstant(), unit).toEqual(end);
    }
  });

  it("work at both ends of the table", () => {
    expect(NepaliDate.MAX_DATE.endOf("year")).toEqual(NepaliDate.MAX_DATE);
    expect(NepaliDate.MAX_DATE.endOf("month")).toEqual(NepaliDate.MAX_DATE);
    expect(NepaliDate.MIN_DATE.startOf("year")).toEqual(NepaliDate.MIN_DATE);
  });

  it("leave the original unchanged", () => {
    const date = bs("2083-07-15");
    date.startOf("year");
    date.endOf("month");
    expect(date.toString()).toBe("2083-07-15");
  });

  it("reject unknown units", () => {
    expect(() => bs("2083-07-15").startOf("quarter" as never)).toThrow(
      /unit must be "day", "week", "month", "fiscalQuarter", "chaumasik", "year" or "fiscalYear", got "quarter"/,
    );
    expect(() => bs("2083-07-15").endOf("quarter" as never)).toThrow(RangeError);
  });
});

describe("weeks", () => {
  // Kartik 1, 2083 is a Sunday, so Kartik 4 is a Wednesday.
  const wednesday = bs("2083-07-04");

  it("run Sunday to Saturday by default", () => {
    expect(wednesday.startOf("week").toString()).toBe("2083-07-01");
    expect(wednesday.endOf("week").toString()).toBe("2083-07-07");
    expect(wednesday.startOf("week").dayOfWeek).toBe(0);
    expect(wednesday.endOf("week").dayOfWeek).toBe(6);
  });

  it("start on the day given by weekStartsOn", () => {
    expect(wednesday.startOf("week", { weekStartsOn: 1 }).toString()).toBe("2083-07-02");
    expect(wednesday.endOf("week", { weekStartsOn: 1 }).toString()).toBe("2083-07-08");
    expect(wednesday.startOf("week", { weekStartsOn: 6 }).toString()).toBe("2083-06-31");
    expect(wednesday.endOf("week", { weekStartsOn: 6 }).toString()).toBe("2083-07-06");
    expect(wednesday.startOf("week", { weekStartsOn: 3 })).toEqual(wednesday);
  });

  it("cross month and year ends", () => {
    // A week starting on Wednesday that contains Kartik 1 begins in Aswin.
    expect(bs("2083-07-01").startOf("week", { weekStartsOn: 3 }).toString()).toBe("2083-06-28");
    const yearEnd = bs("2083-12-30");
    const start = yearEnd.startOf("week");
    const end = yearEnd.endOf("week");
    expect(start.addDays(6)).toEqual(end);
    if (yearEnd.dayOfWeek !== 6) expect(end.year).toBe(2084);
  });

  it("contain the date and run seven days, for every day in the table", () => {
    for (let days = 7; days < TOTAL_DAYS - 7; days++) {
      const date = fromDays(days);
      const start = date.startOf("week");
      if (
        start.dayOfWeek !== 0 ||
        start.addDays(date.dayOfWeek).toString() !== date.toString() ||
        date.endOf("week").toString() !== start.addDays(6).toString()
      ) {
        expect.fail(`${date}: week ${start} to ${date.endOf("week")}`);
      }
    }
  });

  it("start on the right weekday for every weekStartsOn", () => {
    for (let days = 0; days < 7; days++) {
      const date = wednesday.addDays(days);
      for (let weekStartsOn = 0; weekStartsOn <= 6; weekStartsOn++) {
        const options = { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 };
        const start = date.startOf("week", options);
        const end = date.endOf("week", options);
        expect(start.dayOfWeek, `${date} from ${weekStartsOn}`).toBe(weekStartsOn);
        expect(end.dayOfWeek, `${date} from ${weekStartsOn}`).toBe((weekStartsOn + 6) % 7);
        expect(start.addDays(6), `${date} from ${weekStartsOn}`).toEqual(end);
      }
    }
  });

  it("give week ranges for queries", () => {
    expect(wednesday.range("week", { as: "iso" })).toEqual({
      start: "2026-10-17T18:15:00.000Z",
      end: "2026-10-24T18:15:00.000Z",
    });
    expect(wednesday.range("week", { weekStartsOn: 1, as: "iso", offsetMinutes: 0 })).toEqual({
      start: "2026-10-19T00:00:00.000Z",
      end: "2026-10-26T00:00:00.000Z",
    });
    expect(wednesday.adRange("week")).toEqual({ start: "2026-10-18", end: "2026-10-25" });
    expect(wednesday.adRange("week", { weekStartsOn: 1 })).toEqual({
      start: "2026-10-19",
      end: "2026-10-26",
    });
  });

  it("give back-to-back week ranges across the whole table, with no gaps or overlaps", () => {
    for (const weekStartsOn of [0, 1, 6] as const) {
      // Day number of the first week that starts on weekStartsOn and fits in the table.
      const first = (weekStartsOn - NepaliDate.MIN_DATE.dayOfWeek + 7) % 7;
      let previous: { start: number; end: number } | undefined;
      let previousAd: { start: string; end: string } | undefined;
      for (let start = first; start + 7 <= TOTAL_DAYS; start += 7) {
        const date = fromDays(start + 3); // mid-week
        const range = date.range("week", { weekStartsOn, as: "ms" });
        const adRange = date.adRange("week", { weekStartsOn });
        if (
          date.startOf("week", { weekStartsOn }).dayOfWeek !== weekStartsOn ||
          (previous && range.start !== previous.end) ||
          (previousAd && adRange.start !== previousAd.end)
        ) {
          expect.fail(`week of ${date} (from ${weekStartsOn}) doesn't follow the one before`);
        }
        [previous, previousAd] = [range, adRange];
      }
    }
  });

  it("agree with range for every weekStartsOn", () => {
    for (let weekStartsOn = 0; weekStartsOn <= 6; weekStartsOn++) {
      const options = { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 };
      const { start, end } = wednesday.range("week", options);
      expect(wednesday.startOf("week", options).startInstant()).toEqual(start);
      expect(wednesday.endOf("week", options).addDays(1).startInstant()).toEqual(end);
    }
  });

  it("reject weeks that run outside the table", () => {
    // The table starts and ends on a Saturday.
    expect(NepaliDate.MIN_DATE.dayOfWeek).toBe(6);
    expect(NepaliDate.MAX_DATE.dayOfWeek).toBe(6);
    expect(() => NepaliDate.MIN_DATE.startOf("week")).toThrow(
      /week containing 1975-01-01 runs outside the supported range/,
    );
    expect(NepaliDate.MIN_DATE.startOf("week", { weekStartsOn: 6 })).toEqual(NepaliDate.MIN_DATE);
    expect(NepaliDate.MAX_DATE.endOf("week")).toEqual(NepaliDate.MAX_DATE);
    expect(() => NepaliDate.MAX_DATE.range("week", { weekStartsOn: 6 })).toThrow(RangeError);
  });

  it("reject weekStartsOn values that aren't 0–6", () => {
    for (const weekStartsOn of [7, -1, 1.5, Number.NaN, "1"]) {
      expect(
        () => wednesday.startOf("week", { weekStartsOn: weekStartsOn as never }),
        String(weekStartsOn),
      ).toThrow(/weekStartsOn must be 0 \(Sunday\) to 6 \(Saturday\)/);
    }
    // Checked for every unit, so a typo is caught before the unit changes to "week".
    expect(() => wednesday.startOf("month", { weekStartsOn: 7 as never })).toThrow(RangeError);
  });
});
