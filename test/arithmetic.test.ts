import { describe, expect, it } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { NepaliDate } from "../src/nepali-date.js";

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
      const date = NepaliDate.fromDays(days);
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
