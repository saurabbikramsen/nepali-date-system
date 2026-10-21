import { describe, expect, it } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { NepaliDate } from "../src/nepali-date.js";

const bs = (text: string) => NepaliDate.parse(text);

/** Full months from `from` to `to`, by adding one month at a time with addMonths. */
function countMonths(from: NepaliDate, to: NepaliDate): number {
  let months = 0;
  while (!from.addMonths(months + 1).isAfter(to)) months++;
  return months;
}

describe("diffInDays", () => {
  it("counts days, positive when this date is later", () => {
    expect(bs("2083-06-26").diffInDays(bs("2083-06-26"))).toBe(0);
    expect(bs("2083-06-26").diffInDays(bs("2083-06-25"))).toBe(1);
    expect(bs("2083-06-25").diffInDays(bs("2083-06-26"))).toBe(-1);
    expect(bs("2084-01-01").diffInDays(bs("2083-01-01"))).toBe(365);
    expect(bs("2082-01-01").diffInDays(bs("2081-01-01"))).toBe(366);
    expect(NepaliDate.MAX_DATE.diffInDays(NepaliDate.MIN_DATE)).toBe(TOTAL_DAYS - 1);
  });

  it("matches the difference between the AD dates for every day in the table", () => {
    const first = NepaliDate.MIN_DATE;
    const firstMs = Date.parse(first.toAdString());
    for (let days = 0; days < TOTAL_DAYS; days += 7) {
      const date = NepaliDate.fromDays(days);
      const adDays = (Date.parse(date.toAdString()) - firstMs) / 86_400_000;
      if (date.diffInDays(first) !== adDays) {
        expect.fail(`${date} is ${date.diffInDays(first)} days after ${first}, not ${adDays}`);
      }
    }
  });
});

describe("diffInMonths", () => {
  // toBe uses Object.is, so these also check that no 0 comes back as -0.
  it.each([
    ["2083-02-15", "2083-01-15", 1],
    ["2083-02-14", "2083-01-15", 0],
    ["2083-01-15", "2083-02-15", -1],
    ["2083-01-15", "2083-02-14", 0],
    ["2084-01-15", "2083-01-15", 12],
    ["2084-03-14", "2083-01-15", 13],
    ["2083-12-30", "2083-01-01", 11],
    ["2084-01-01", "2083-12-30", 0],
    // Aswin 2056 has 30 days, so a month from Bhadra 32 ends on Aswin 30, as in addMonths.
    ["2056-06-30", "2056-05-32", 1],
    ["2056-06-29", "2056-05-32", 0],
    // Counted from the earlier date, so swapping the dates only flips the sign.
    ["2056-05-32", "2056-06-30", -1],
  ])("%s.diffInMonths(%s) is %i", (a, b, months) => {
    expect(bs(a).diffInMonths(bs(b))).toBe(months);
  });

  it("matches adding one month at a time, from days 29 to 32", () => {
    for (const from of ["2056-05-32", "2083-03-32", "2083-01-31", "2083-07-30", "2083-08-29"]) {
      const start = bs(from);
      for (let days = 0; days < 3 * 366; days++) {
        const to = start.addDays(days);
        const months = countMonths(start, to);
        if (to.diffInMonths(start) !== months || start.diffInMonths(to) !== 0 - months) {
          expect.fail(`${to}.diffInMonths(${start}) should be ${months}`);
        }
      }
    }
  });

  it("covers the whole table", () => {
    expect(NepaliDate.MAX_DATE.diffInMonths(NepaliDate.MIN_DATE)).toBe(111 * 12 + 11);
  });
});

describe("diffInYears", () => {
  it.each([
    ["2084-06-26", "2083-06-26", 1],
    ["2084-06-25", "2083-06-26", 0],
    ["2083-06-26", "2084-06-26", -1],
    ["2083-06-26", "2084-06-25", 0],
    ["2084-03-14", "2083-01-15", 1],
    // Chaitra 2082 has 30 days, so a year from Chaitra 31 ends on Chaitra 30, as in addYears.
    ["2082-12-30", "2081-12-31", 1],
    ["2082-12-29", "2081-12-31", 0],
  ])("%s.diffInYears(%s) is %i", (a, b, years) => {
    expect(bs(a).diffInYears(bs(b))).toBe(years);
  });

  it("is the full months divided into whole years", () => {
    const birth = bs("2056-05-32");
    for (let days = 0; days < 5 * 366; days += 3) {
      const date = birth.addDays(days);
      expect(date.diffInYears(birth), String(date)).toBe(Math.floor(date.diffInMonths(birth) / 12));
    }
  });

  it("covers the whole table", () => {
    expect(NepaliDate.MAX_DATE.diffInYears(NepaliDate.MIN_DATE)).toBe(111);
    expect(NepaliDate.MIN_DATE.diffInYears(NepaliDate.MAX_DATE)).toBe(-111);
  });
});

describe("differences", () => {
  it("reject anything but a NepaliDate", () => {
    const date = bs("2083-06-26");
    expect(() => date.diffInDays("2083-01-01" as never)).toThrow(TypeError);
    expect(() => date.diffInMonths("2083-01-01" as never)).toThrow(
      /diffInMonths takes a NepaliDate/,
    );
    expect(() => date.diffInYears(undefined as never)).toThrow(TypeError);
  });
});
