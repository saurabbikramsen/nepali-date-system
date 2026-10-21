import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { type Age, NepaliDate } from "../src/nepali-date.js";

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

describe("NepaliDate.age", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // toEqual on plain objects: years, then months, then days.
  it.each([
    ["2056-05-15", "2083-06-26", { years: 27, months: 1, days: 11 }],
    ["2056-06-26", "2083-06-26", { years: 27, months: 0, days: 0 }], // a birthday
    // The day before: 26 years and 11 months reach 2083-05-26, and Bhadra 2083 has 31 days.
    ["2056-06-26", "2083-06-25", { years: 26, months: 11, days: 30 }],
    ["2083-06-26", "2083-06-26", { years: 0, months: 0, days: 0 }], // born today
    ["2083-06-26", "2083-06-27", { years: 0, months: 0, days: 1 }],
  ])("is %s to %s: %o", (birth, on, age) => {
    expect(NepaliDate.age(bs(birth), bs(on))).toEqual(age);
  });

  it.each([
    // Chaitra 2082 has 30 days, so a Chaitra 31 birthday comes on Chaitra 30.
    ["2081-12-31", "2082-12-29", { years: 0, months: 11, days: 29 }],
    ["2081-12-31", "2082-12-30", { years: 1, months: 0, days: 0 }],
    // Aswin 2056 has 30 days and Bhadra 2057 has 31, so a Bhadra 32 birth date counts from
    // their last days.
    ["2056-05-32", "2056-06-30", { years: 0, months: 1, days: 0 }],
    ["2056-05-32", "2056-07-01", { years: 0, months: 1, days: 1 }],
    ["2056-05-32", "2057-05-31", { years: 1, months: 0, days: 0 }],
    // Jestha 2058 has 32 days, so this is exactly 21 months. Adding a year first would lose the
    // 32nd in Bhadra 2057 and leave a day over.
    ["2056-05-32", "2058-02-32", { years: 1, months: 9, days: 0 }],
  ])("puts a birthday the month lacks on its last day: %s to %s", (birth, on, age) => {
    expect(NepaliDate.age(bs(birth), bs(on))).toEqual(age);
  });

  it("agrees with diffInYears and diffInMonths, and adds back up to onDate", () => {
    const birth = bs("2056-05-32");
    for (let days = 0; days < 4 * 366; days++) {
      const on = birth.addDays(days);
      const { years, months, days: rest } = NepaliDate.age(birth, on);
      const label = `${birth} to ${on}`;
      expect(years, label).toBe(on.diffInYears(birth));
      expect(years * 12 + months, label).toBe(on.diffInMonths(birth));
      expect(birth.addMonths(years * 12 + months).addDays(rest), label).toEqual(on);
    }
  });

  it("is on today's date in Nepal by default", () => {
    vi.useFakeTimers();
    // 2026-10-20T18:15Z is midnight in Kathmandu as 2083-07-04 begins.
    vi.setSystemTime(new Date("2026-10-20T18:15:00Z"));
    expect(NepaliDate.age(bs("2056-07-04"))).toEqual({ years: 27, months: 0, days: 0 });
    vi.setSystemTime(new Date("2026-10-20T18:14:59Z"));
    expect(NepaliDate.age(bs("2056-07-04"))).toEqual({ years: 26, months: 11, days: 30 });
    expect(NepaliDate.age(bs("2056-07-04"), undefined)).toEqual(
      NepaliDate.age(bs("2056-07-04"), NepaliDate.today()),
    );
  });

  it("returns a plain object typed as Age", () => {
    const age = NepaliDate.age(bs("2056-05-15"), bs("2083-06-26"));
    expect(Object.keys(age)).toEqual(["years", "months", "days"]);
    expectTypeOf(age).toEqualTypeOf<Age>();
  });

  it("rejects a birth date after onDate, and anything but a NepaliDate", () => {
    expect(() => NepaliDate.age(bs("2083-06-27"), bs("2083-06-26"))).toThrow(
      /age needs a birthDate on or before onDate, got 2083-06-27 and 2083-06-26/,
    );
    expect(() => NepaliDate.age("2056-05-15" as never)).toThrow(/age takes a NepaliDate/);
    expect(() => NepaliDate.age(bs("2056-05-15"), "2083-06-26" as never)).toThrow(TypeError);
    expect(() => NepaliDate.age(bs("2056-05-15"), null as never)).toThrow(TypeError);
  });
});
