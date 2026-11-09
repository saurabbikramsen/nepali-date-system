import { describe, expect, expectTypeOf, it } from "vitest";
import * as api from "../src/index.js";
import type {
  AdDateRange,
  Age,
  Chaumasik,
  DateParts,
  DigitSystem,
  FiscalQuarter,
  FiscalYear,
  FiscalYearOptions,
  FormatOptions,
  InstantFormat,
  InstantFormatTypes,
  InstantOptions,
  InstantRange,
  Locale,
  LocaleName,
  MonthName,
  ParseOptions,
  PeriodOptions,
  RangeOptions,
  RangeUnit,
  Weekday,
  WeekOptions,
} from "../src/index.js";

// The public API, pinned. Adding or removing anything here is a decision to support it, or to
// break code that uses it, so it should only change on purpose.

/** TypeScript-private helpers. They exist at runtime, but aren't typed or documented. */
const INTERNAL_STATICS = ["spanDays"];
const INTERNAL_METHODS = [
  "fiscalPeriodBounds",
  "fullMonthSpans",
  "outOfRange",
  "periodBounds",
  "periodDays",
  "periodName",
  "shiftDays",
  "shiftMonths",
];

const sorted = (names: string[]) => [...names].sort();

describe("public API", () => {
  it("exports these values", () => {
    expect(sorted(Object.keys(api))).toEqual([
      "FIRST_YEAR",
      "LAST_OFFICIAL_YEAR",
      "LAST_YEAR",
      "LOCALES",
      "MONTH_NAMES",
      "NepaliDate",
    ]);
  });

  it("has these static members on NepaliDate", () => {
    const names = Object.getOwnPropertyNames(api.NepaliDate).filter(
      (name) => !["length", "name", "prototype"].includes(name),
    );
    expect(sorted(names)).toEqual(
      sorted([
        ...INTERNAL_STATICS,
        // Creating dates
        "fromAd",
        "fromInstant",
        "parse",
        "today",
        // The calendar
        "MIN_DATE",
        "MAX_DATE",
        "daysInMonth",
        "daysInYear",
        "isValid",
        // Comparing and measuring
        "compare",
        "min",
        "max",
        "age",
        // Spans of dates
        "rangeBetween",
        "adRangeBetween",
        "eachDay",
        "eachMonth",
      ]),
    );
  });

  it("has these members on every NepaliDate", () => {
    const names = Object.getOwnPropertyNames(api.NepaliDate.prototype).filter(
      (name) => name !== "constructor",
    );
    expect(sorted(names)).toEqual(
      sorted([
        ...INTERNAL_METHODS,
        // Getters
        "dayOfWeek",
        "dayOfYear",
        "daysInMonth",
        "daysInYear",
        // Fiscal periods
        "fiscalYear",
        "fiscalQuarter",
        "chaumasik",
        // Comparing
        "isBefore",
        "isAfter",
        "isEqual",
        "isSame",
        "isBetween",
        // Differences
        "diffInDays",
        "diffInMonths",
        "diffInYears",
        // Arithmetic
        "addDays",
        "addWeeks",
        "addMonths",
        "addYears",
        "startOf",
        "endOf",
        // Converting and printing
        "toAd",
        "toAdString",
        "startInstant",
        "range",
        "adRange",
        "format",
        "toString",
        "toJSON",
      ]),
    );
    expect(Object.keys(new api.NepaliDate(2083, 6, 26))).toEqual(["year", "month", "day"]);
  });

  it("lets every static method be called on its own, without NepaliDate as this", () => {
    const {
      adRangeBetween,
      age,
      compare,
      daysInMonth,
      daysInYear,
      eachDay,
      eachMonth,
      fromAd,
      fromInstant,
      isValid,
      max,
      min,
      parse,
      rangeBetween,
      today,
    } = api.NepaliDate;
    const a = parse("2083-06-26");
    const b = fromAd(2026, 11, 1); // 2083-07-15
    expect([b, a].sort(compare).map(String)).toEqual(["2083-06-26", "2083-07-15"]);
    // map passes an index as the second argument, which parse ignores.
    expect(["2083-06-26", "2083-07-15"].map(parse).map(String)).toEqual([
      "2083-06-26",
      "2083-07-15",
    ]);
    expect([String(min(a, b)), String(max([a, b]))]).toEqual(["2083-06-26", "2083-07-15"]);
    expect(String(fromInstant("2026-10-17T18:15:00Z"))).toBe("2083-07-01");
    expect(today()).toBeInstanceOf(api.NepaliDate);
    expect([isValid(2083, 3, 32), daysInMonth(2083, 3), daysInYear(2081)]).toEqual([true, 32, 366]);
    expect(rangeBetween(a, b, { as: "iso" }).start).toBe("2026-10-11T18:15:00.000Z");
    expect(adRangeBetween(a, b)).toEqual({ start: "2026-10-12", end: "2026-11-02" });
    expect([eachDay(a, b).length, eachMonth(a, b).length]).toEqual([21, 2]); // Aswin has 31 days
    expect(age(parse("2056-05-15"), a)).toEqual({ years: 27, months: 1, days: 11 });
  });

  it("declares this: void on every static method, so unbound-method doesn't flag them", () => {
    const { NepaliDate } = api;
    expectTypeOf(NepaliDate.adRangeBetween).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.age).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.compare).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.daysInMonth).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.daysInYear).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.eachDay).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.eachMonth).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.fromAd).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.fromInstant).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.isValid).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.max).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.min).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.parse).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.rangeBetween).thisParameter.toEqualTypeOf<void>();
    expectTypeOf(NepaliDate.today).thisParameter.toEqualTypeOf<void>();
  });

  it("no longer has fromDays, which exposed internal day numbers", () => {
    expect("fromDays" in api.NepaliDate).toBe(false);
    expect("fromDays" in api).toBe(false);
  });

  it("exports these types", () => {
    // Each line fails to compile if the type is removed or renamed.
    expectTypeOf<AdDateRange>().toEqualTypeOf<{ start: string; end: string }>();
    expectTypeOf<Age>().toEqualTypeOf<{ years: number; months: number; days: number }>();
    expectTypeOf<Chaumasik>().toEqualTypeOf<1 | 2 | 3>();
    expectTypeOf<DateParts>().toEqualTypeOf<{ year: number; month: number; day: number }>();
    expectTypeOf<DigitSystem>().toEqualTypeOf<"latin" | "devanagari">();
    expectTypeOf<FiscalQuarter>().toEqualTypeOf<1 | 2 | 3 | 4>();
    expectTypeOf<FiscalYear>().toEqualTypeOf<{
      startYear: number;
      endYear: number;
      label: string;
    }>();
    expectTypeOf<FiscalYearOptions>().toEqualTypeOf<{ fiscalYearStartMonth?: number }>();
    expectTypeOf<FormatOptions>().toHaveProperty("digits");
    expectTypeOf<InstantFormat>().toEqualTypeOf<"date" | "iso" | "ms">();
    expectTypeOf<InstantFormatTypes>().toEqualTypeOf<{ date: Date; iso: string; ms: number }>();
    expectTypeOf<InstantOptions>().toEqualTypeOf<{ offsetMinutes?: number }>();
    expectTypeOf<InstantRange<string>>().toEqualTypeOf<{ start: string; end: string }>();
    expectTypeOf<Locale>().toHaveProperty("monthsShort");
    expectTypeOf<LocaleName>().toEqualTypeOf<"en" | "ne">();
    expectTypeOf<MonthName>().toEqualTypeOf<(typeof api.MONTH_NAMES)[number]>();
    expectTypeOf<ParseOptions>().toHaveProperty("strict");
    expectTypeOf<WeekOptions>().toEqualTypeOf<{ weekStartsOn?: Weekday }>();
    expectTypeOf<PeriodOptions>().toEqualTypeOf<{
      weekStartsOn?: Weekday;
      fiscalYearStartMonth?: number;
    }>();
    expectTypeOf<RangeOptions<"iso">>().toMatchTypeOf<InstantOptions & PeriodOptions>();
    expectTypeOf<RangeUnit>().toEqualTypeOf<
      "day" | "week" | "month" | "fiscalQuarter" | "chaumasik" | "year" | "fiscalYear"
    >();
    expectTypeOf<Weekday>().toEqualTypeOf<0 | 1 | 2 | 3 | 4 | 5 | 6>();
    expectTypeOf(new api.NepaliDate(2083, 6, 26).dayOfWeek).toEqualTypeOf<Weekday>();
  });
});
