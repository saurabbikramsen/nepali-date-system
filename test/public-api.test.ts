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
