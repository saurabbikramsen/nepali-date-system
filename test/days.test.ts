import { describe, expect, it } from "vitest";
import { FIRST_YEAR, LAST_YEAR, MONTH_LENGTHS } from "../src/defined.js";
import {
  adToDays,
  bsToDays,
  daysToAd,
  daysToBs,
  TOTAL_DAYS,
  YEAR_START,
} from "../src/core/days.js";
import { BAISAKH_1_AD } from "./fixtures/baisakh1.js";
import { DOCUMENTED_DATES, WEEKDAY_RECORDS } from "./fixtures/documented-dates.js";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isoDate(ad: { year: number; month: number; day: number }): string {
  return `${ad.year}-${String(ad.month).padStart(2, "0")}-${String(ad.day).padStart(2, "0")}`;
}

describe("month length table", () => {
  it("has 12 months of 29–32 days in every year", () => {
    MONTH_LENGTHS.forEach((months, i) => {
      expect(months, `BS ${FIRST_YEAR + i}`).toHaveLength(12);
      for (const days of months) {
        expect(days, `BS ${FIRST_YEAR + i}`).toBeGreaterThanOrEqual(29);
        expect(days, `BS ${FIRST_YEAR + i}`).toBeLessThanOrEqual(32);
      }
    });
  });

  it("has 365 or 366 days in every year", () => {
    MONTH_LENGTHS.forEach((months, i) => {
      const total = months.reduce((a, b) => a + b, 0);
      expect([365, 366], `BS ${FIRST_YEAR + i} totals ${total}`).toContain(total);
    });
  });
});

describe("YEAR_START", () => {
  it("starts at 0 and has one entry per year plus an end marker", () => {
    expect(YEAR_START[0]).toBe(0);
    expect(YEAR_START).toHaveLength(LAST_YEAR - FIRST_YEAR + 2);
    expect(TOTAL_DAYS).toBe(YEAR_START[YEAR_START.length - 1]);
  });

  it("matches the month table", () => {
    MONTH_LENGTHS.forEach((months, i) => {
      expect(YEAR_START[i + 1] - YEAR_START[i]).toBe(months.reduce((a, b) => a + b, 0));
    });
  });
});

describe("known dates", () => {
  it("documents 20+ dates, including New Year and dates in 32-day months", () => {
    const newYears = DOCUMENTED_DATES.filter(({ bs: [, month, day] }) => month === 1 && day === 1);
    const in32DayMonths = DOCUMENTED_DATES.filter(
      ({ bs: [year, month] }) => MONTH_LENGTHS[year - FIRST_YEAR][month - 1] === 32,
    );
    expect(DOCUMENTED_DATES.length).toBeGreaterThanOrEqual(20);
    expect(newYears).not.toHaveLength(0);
    expect(in32DayMonths).not.toHaveLength(0);
  });

  it("converts every documented date BS → AD and AD → BS", () => {
    for (const { bs, ad, event, source } of DOCUMENTED_DATES) {
      const label = `BS ${bs.join("-")}: ${event} (${source})`;
      const [year, month, day] = ad.split("-").map(Number);
      expect(isoDate(daysToAd(bsToDays(...bs))), label).toBe(ad);
      expect(daysToBs(adToDays(year, month, day)), label).toEqual({
        year: bs[0],
        month: bs[1],
        day: bs[2],
      });
    }
  });

  it("puts Baisakh 1 of every published year on its recorded AD date", () => {
    for (const [year, expected] of Object.entries(BAISAKH_1_AD)) {
      const ad = daysToAd(bsToDays(Number(year), 1, 1));
      expect(isoDate(ad), `Baisakh 1, ${year}`).toBe(expected);
    }
  });

  it("matches the weekday written on dated historical documents", () => {
    for (const { bs, weekday, event, source } of WEEKDAY_RECORDS) {
      const ad = daysToAd(bsToDays(...bs));
      const actual = WEEKDAYS[new Date(Date.UTC(ad.year, ad.month - 1, ad.day)).getUTCDay()];
      expect(actual, `BS ${bs.join("-")}: ${event} (${source})`).toBe(weekday);
    }
  });
});

describe("round trip over every day in the table", () => {
  it("BS → days → BS and AD → days → AD return the same day", () => {
    for (let days = 0; days < TOTAL_DAYS; days++) {
      const bs = daysToBs(days);
      const ad = daysToAd(days);
      if (
        bsToDays(bs.year, bs.month, bs.day) !== days ||
        adToDays(ad.year, ad.month, ad.day) !== days
      ) {
        expect.fail(
          `round trip failed at day ${days} (BS ${JSON.stringify(bs)}, AD ${JSON.stringify(ad)})`,
        );
      }
    }
  });

  it("moves forward exactly one BS day at a time", () => {
    let prev = daysToBs(0);
    for (let days = 1; days < TOTAL_DAYS; days++) {
      const next = daysToBs(days);
      const sameMonth =
        next.year === prev.year && next.month === prev.month && next.day === prev.day + 1;
      const newMonth =
        next.day === 1 && prev.day === MONTH_LENGTHS[prev.year - FIRST_YEAR][prev.month - 1];
      if (!sameMonth && !newMonth) {
        expect.fail(
          `unexpected step at day ${days}: ${JSON.stringify(prev)} → ${JSON.stringify(next)}`,
        );
      }
      prev = next;
    }
  });

  it("covers the first and last day of the table", () => {
    expect(daysToBs(0)).toEqual({ year: FIRST_YEAR, month: 1, day: 1 });
    const lastMonth = MONTH_LENGTHS[LAST_YEAR - FIRST_YEAR][11];
    expect(daysToBs(TOTAL_DAYS - 1)).toEqual({ year: LAST_YEAR, month: 12, day: lastMonth });
  });
});

describe("invalid input", () => {
  it("rejects BS dates outside the table", () => {
    expect(() => bsToDays(FIRST_YEAR - 1, 12, 30)).toThrow(RangeError);
    expect(() => bsToDays(LAST_YEAR + 1, 1, 1)).toThrow(RangeError);
  });

  it("rejects impossible BS months and days", () => {
    expect(() => bsToDays(2083, 0, 1)).toThrow(RangeError);
    expect(() => bsToDays(2083, 13, 1)).toThrow(RangeError);
    expect(() => bsToDays(2083, 1, 0)).toThrow(RangeError);
    const shortMonth = MONTH_LENGTHS[2083 - FIRST_YEAR].findIndex((d) => d < 32) + 1;
    const length = MONTH_LENGTHS[2083 - FIRST_YEAR][shortMonth - 1];
    expect(() => bsToDays(2083, shortMonth, length + 1)).toThrow(RangeError);
  });

  it("rejects non-integers", () => {
    expect(() => bsToDays(2083, 6.5, 1)).toThrow(RangeError);
    expect(() => bsToDays(Number.NaN, 1, 1)).toThrow(RangeError);
    expect(() => daysToBs(1.5)).toThrow(RangeError);
  });

  it("rejects invalid AD dates instead of rolling them over", () => {
    expect(() => adToDays(2026, 2, 29)).toThrow(RangeError);
    expect(() => adToDays(2026, 13, 1)).toThrow(RangeError);
  });

  it("rejects AD dates outside the table", () => {
    expect(() => adToDays(1918, 4, 12)).toThrow(RangeError);
    expect(() => adToDays(2100, 1, 1)).toThrow(RangeError);
  });

  it("rejects day numbers outside the table", () => {
    expect(() => daysToBs(-1)).toThrow(RangeError);
    expect(() => daysToBs(TOTAL_DAYS)).toThrow(RangeError);
    expect(() => daysToAd(TOTAL_DAYS)).toThrow(RangeError);
  });
});
