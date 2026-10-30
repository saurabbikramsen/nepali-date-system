import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { FIRST_YEAR, LAST_YEAR } from "../src/defined.js";
import { fromDays, NepaliDate } from "../src/nepali-date.js";

/** A day number anywhere in the table. */
const dayNumber = fc.integer({ min: 0, max: TOTAL_DAYS - 1 });
/** A date anywhere in the table. */
const date = dayNumber.map((days) => fromDays(days));
/** A month anywhere in the table, counted from year 0 as year × 12 + (month − 1). */
const monthIndex = fc.integer({ min: FIRST_YEAR * 12, max: LAST_YEAR * 12 + 11 });

const monthIndexOf = (d: NepaliDate) => d.year * 12 + (d.month - 1);
const options = { numRuns: 1000 };

describe("addDays and addWeeks", () => {
  it("addDays(n) then addDays(-n) returns the starting date", () => {
    // The start and the target are both in the table, so n never runs off the end.
    fc.assert(
      fc.property(dayNumber, dayNumber, (start, target) => {
        const from = fromDays(start);
        const n = target - start;
        expect(from.addDays(n).addDays(-n)).toEqual(from);
      }),
      options,
    );
  });

  it("adding a then b is the same as adding a + b", () => {
    fc.assert(
      fc.property(dayNumber, dayNumber, dayNumber, (start, middle, end) => {
        const from = fromDays(start);
        const a = middle - start;
        const b = end - middle;
        expect(from.addDays(a).addDays(b)).toEqual(from.addDays(a + b));
      }),
      options,
    );
  });

  it("moves the weekday by n mod 7", () => {
    fc.assert(
      fc.property(dayNumber, dayNumber, (start, target) => {
        const from = fromDays(start);
        const n = target - start;
        expect(from.addDays(n).dayOfWeek).toBe((((from.dayOfWeek + n) % 7) + 7) % 7);
      }),
      options,
    );
  });

  it("addWeeks(n) is addDays(7n)", () => {
    fc.assert(
      fc.property(dayNumber, dayNumber, (start, target) => {
        const from = fromDays(start);
        // Whole weeks from start towards target, so the result stays in the table.
        const weeks = Math.trunc((target - start) / 7);
        expect(from.addWeeks(weeks)).toEqual(from.addDays(7 * weeks));
      }),
      options,
    );
  });
});

describe("addMonths and addYears", () => {
  it("land in the right month, on the same day or that month's last day", () => {
    fc.assert(
      fc.property(date, monthIndex, (from, target) => {
        const n = target - monthIndexOf(from);
        const result = from.addMonths(n);
        expect(monthIndexOf(result)).toBe(target);
        expect(result.day).toBe(Math.min(from.day, result.daysInMonth));
      }),
      options,
    );
  });

  it("never move the day forward, and change it only when the month is too short", () => {
    fc.assert(
      fc.property(date, monthIndex, (from, target) => {
        const result = from.addMonths(target - monthIndexOf(from));
        expect(result.day).toBeLessThanOrEqual(from.day);
        if (from.day <= result.daysInMonth) expect(result.day).toBe(from.day);
      }),
      options,
    );
  });

  it("are undone by the opposite amount for days 1 to 29", () => {
    fc.assert(
      fc.property(date, monthIndex, (from, target) => {
        fc.pre(from.day <= 29);
        const n = target - monthIndexOf(from);
        expect(from.addMonths(n).addMonths(-n)).toEqual(from);
      }),
      options,
    );
  });

  it("addYears(n) is addMonths(12n)", () => {
    fc.assert(
      fc.property(date, fc.integer({ min: FIRST_YEAR, max: LAST_YEAR }), (from, year) => {
        const n = year - from.year;
        expect(from.addYears(n)).toEqual(from.addMonths(12 * n));
      }),
      options,
    );
  });
});

describe("differences", () => {
  it("diffInDays is undone by addDays and flips sign when swapped", () => {
    fc.assert(
      fc.property(date, date, (a, b) => {
        expect(b.addDays(a.diffInDays(b))).toEqual(a);
        expect(a.diffInDays(b) + b.diffInDays(a)).toBe(0);
      }),
      options,
    );
  });

  it("diffInMonths and diffInYears are the most addMonths and addYears can add without passing the later date", () => {
    const lastMonthIndex = LAST_YEAR * 12 + 11;
    fc.assert(
      fc.property(date, date, (x, y) => {
        const [earlier, later] = x.isAfter(y) ? [y, x] : [x, y];
        const months = later.diffInMonths(earlier);
        const years = later.diffInYears(earlier);
        expect(earlier.addMonths(months).isAfter(later)).toBe(false);
        expect(earlier.addYears(years).isAfter(later)).toBe(false);
        // One more would pass the later date, when it's still in the table.
        if (monthIndexOf(earlier) + months + 1 <= lastMonthIndex) {
          expect(earlier.addMonths(months + 1).isAfter(later)).toBe(true);
        }
        if (earlier.year + years + 1 <= LAST_YEAR) {
          expect(earlier.addYears(years + 1).isAfter(later)).toBe(true);
        }
        // Swapping only flips the sign, and never gives -0.
        expect(earlier.diffInMonths(later)).toBe(0 - months);
        expect(earlier.diffInYears(later)).toBe(0 - years);
      }),
      options,
    );
  });
});

describe("age", () => {
  it("is years and months that addMonths can add without passing onDate, then the days left", () => {
    fc.assert(
      fc.property(date, date, (x, y) => {
        const [birth, on] = x.isAfter(y) ? [y, x] : [x, y];
        const { years, months, days } = NepaliDate.age(birth, on);
        expect(months >= 0 && months <= 11).toBe(true);
        expect(years * 12 + months).toBe(on.diffInMonths(birth));
        expect(days).toBe(on.diffInDays(birth.addMonths(years * 12 + months)));
        // The days left are fewer than a month, so the months are full.
        expect(days >= 0 && days <= 31).toBe(true);
      }),
      options,
    );
  });
});

describe("comparison", () => {
  it("compare, isBefore, isAfter and isEqual agree with each other and with string order", () => {
    fc.assert(
      fc.property(date, date, (a, b) => {
        const order = NepaliDate.compare(a, b);
        expect(order).toBe(-NepaliDate.compare(b, a) || 0);
        expect(a.isBefore(b)).toBe(order < 0);
        expect(a.isAfter(b)).toBe(order > 0);
        expect(a.isEqual(b)).toBe(order === 0);
        expect(order).toBe(Math.sign(a.toString().localeCompare(b.toString())));
      }),
      options,
    );
  });

  it("sorting with compare gives the same order as sorting YYYY-MM-DD strings", () => {
    fc.assert(
      fc.property(fc.array(date, { maxLength: 50 }), (dates) => {
        const sorted = [...dates].sort(NepaliDate.compare).map(String);
        expect(sorted).toEqual(dates.map(String).sort());
      }),
    );
  });

  it("min and max are the first and last after sorting", () => {
    fc.assert(
      fc.property(fc.array(date, { minLength: 1, maxLength: 50 }), (dates) => {
        const sorted = [...dates].sort(NepaliDate.compare);
        expect(NepaliDate.min(dates)).toEqual(sorted[0]);
        expect(NepaliDate.max(dates)).toEqual(sorted[sorted.length - 1]);
      }),
    );
  });

  it("a date is in its own period of every unit but week, from startOf to endOf", () => {
    const unit = fc.constantFrom<
      "day" | "month" | "fiscalQuarter" | "chaumasik" | "year" | "fiscalYear"
    >("day", "month", "fiscalQuarter", "chaumasik", "year", "fiscalYear");
    fc.assert(
      fc.property(date, unit, (d, unit) => {
        // Fiscal years 1974/75 and 2086/87 run past the ends of the table, and so do their
        // third chaumasiks.
        const { startYear, endYear } = d.fiscalYear();
        const pastTheEnds = startYear < FIRST_YEAR || endYear > LAST_YEAR;
        fc.pre(
          !pastTheEnds || (unit !== "fiscalYear" && !(unit === "chaumasik" && d.chaumasik() === 3)),
        );
        const start = d.startOf(unit);
        const end = d.endOf(unit);
        expect(d.isBetween(start, end)).toBe(true);
        expect(start.isSame(d, unit) && end.isSame(d, unit)).toBe(true);
        if (unit === "fiscalQuarter") {
          expect([start.fiscalQuarter(), end.fiscalQuarter()]).toEqual([
            d.fiscalQuarter(),
            d.fiscalQuarter(),
          ]);
        }
        if (unit === "chaumasik") {
          expect([start.chaumasik(), end.chaumasik()]).toEqual([d.chaumasik(), d.chaumasik()]);
        }
        if (!start.isEqual(NepaliDate.MIN_DATE)) {
          expect(start.addDays(-1).isSame(d, unit)).toBe(false);
        }
        if (!end.isEqual(NepaliDate.MAX_DATE)) {
          expect(end.addDays(1).isSame(d, unit)).toBe(false);
        }
      }),
      options,
    );
  });
});
