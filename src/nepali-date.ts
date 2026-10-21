import {
  adToDays,
  bsToDays,
  type DateParts,
  daysInMonth,
  daysInYear,
  daysToAd,
  daysToBs,
  EPOCH_AD_MS,
  EPOCH_WEEKDAY,
  isValidBs,
  MS_PER_DAY,
  TOTAL_DAYS,
  YEAR_START,
} from "./core/days.js";
import { daysToStartInstant, instantToDays, nepalOffsetMs } from "./core/nepal-time.js";
import { FIRST_YEAR, LAST_YEAR } from "./defined.js";
import { toLatinDigits } from "./digits.js";
import { formatDate, type FormatOptions } from "./format.js";
import { LOCALES } from "./locales.js";
import { type ParseOptions, parseWithPattern } from "./parse.js";

/**
 * A 4-digit year, then a month and day of one or two digits, all separated by the same
 * "-", "/", "." or single space. Year first only: day-first text like 26/06/2083 is ambiguous.
 * Matched after Devanagari digits are rewritten as 0–9.
 */
const YEAR_FIRST_DATE = /^(\d{4})([-/. ])(\d{1,2})\2(\d{1,2})$/;

function parseYearFirst(text: string, calendar: "BS" | "AD"): [number, number, number] {
  const match = YEAR_FIRST_DATE.exec(toLatinDigits(text));
  if (!match) {
    const example = calendar === "BS" ? "2083-06-26" : "2026-10-12";
    throw new RangeError(
      `Expected a year-first ${calendar} date like ${example} (separated by -, /, . or a space), got ${JSON.stringify(text)}`,
    );
  }
  return [Number(match[1]), Number(match[3]), Number(match[4])];
}

/**
 * An ISO 8601 date and time that ends in Z or a ±HH:MM offset. Without an offset, Date.parse
 * reads the time in the server's own time zone, so the same text would give different dates.
 */
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Reads a Date, ISO 8601 string or epoch milliseconds as a UTC timestamp. */
function toEpochMs(instant: Date | string | number): number {
  let ms: number;
  if (typeof instant === "string") {
    if (!ISO_INSTANT.test(instant)) {
      const hint = YEAR_FIRST_DATE.test(toLatinDigits(instant))
        ? " Use NepaliDate.fromAd for a calendar date."
        : "";
      throw new RangeError(
        `Expected an ISO 8601 time with Z or a ±HH:MM offset like 2026-10-18T10:30:00Z, got ${JSON.stringify(instant)}.${hint}`,
      );
    }
    ms = Date.parse(instant);
  } else {
    // new Date() gives NaN for NaN, ±Infinity and numbers outside the Date range.
    ms = new Date(instant).getTime();
  }
  if (Number.isNaN(ms)) {
    throw new RangeError(
      `Invalid instant: ${typeof instant === "string" ? JSON.stringify(instant) : String(instant)}`,
    );
  }
  return ms;
}

/** Options for reading a moment in time as a date. */
export interface InstantOptions {
  /**
   * A fixed UTC offset in minutes to use instead of Nepal's, positive east of UTC:
   * 345 for +05:45, -240 for -04:00. This is the opposite sign to Date#getTimezoneOffset.
   */
  offsetMinutes?: number;
}

/**
 * The calendar periods that NepaliDate#range, startOf and endOf cover. A "year" runs from
 * Baisakh 1 and a "fiscalYear" from Shrawan 1 unless `fiscalYearStartMonth` says otherwise,
 * each to the day before the next one starts. A "fiscalQuarter" is three months of the fiscal
 * year and a "chaumasik" four: with the default Shrawan start, the quarters are Shrawan–Aswin,
 * Kartik–Poush, Magh–Chaitra and Baisakh–Asar, and the chaumasiks are the government's
 * reporting periods Shrawan–Kartik, Mangsir–Falgun and Chaitra–Asar.
 */
export type RangeUnit =
  "day" | "week" | "month" | "fiscalQuarter" | "chaumasik" | "year" | "fiscalYear";

/** A weekday number: 0 is Sunday, 6 is Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Options for periods that can be a week. */
export interface WeekOptions {
  /**
   * The day a week starts on, 0 (Sunday, the default and the start of Nepal's working week)
   * to 6 (Saturday). Only used when the unit is "week".
   */
  weekStartsOn?: Weekday;
}

/** Options for fiscal years and their quarters and chaumasiks. */
export interface FiscalYearOptions {
  /**
   * The month the fiscal year starts in, 1 (Baisakh) to 12 (Chaitra). Defaults to 4, Shrawan,
   * when the government's fiscal year starts. With 1, the fiscal year is the BS year. Only used
   * for fiscal years, quarters and chaumasiks.
   */
  fiscalYearStartMonth?: number;
}

/** Options for the periods of a RangeUnit: weeks and fiscal years can start when you choose. */
export interface PeriodOptions extends WeekOptions, FiscalYearOptions {}

/**
 * How a range gives its bounds: a Date, an ISO 8601 string in UTC such as
 * "2026-10-17T18:15:00.000Z", or epoch milliseconds.
 */
export type InstantFormat = "date" | "iso" | "ms";

/** The type of a range bound for each InstantFormat. */
export interface InstantFormatTypes {
  date: Date;
  iso: string;
  ms: number;
}

/** Options for NepaliDate#range and NepaliDate.rangeBetween. */
export interface RangeOptions<F extends InstantFormat = "date">
  extends InstantOptions, PeriodOptions {
  /** The type of `start` and `end`: "date" (the default), "iso" or "ms". */
  as?: F;
}

/**
 * A half-open span of time: it includes `start` and excludes `end`, which is the start of the
 * next period. Query with `>= start AND < end`.
 */
export interface InstantRange<T = Date> {
  start: T;
  end: T;
}

/**
 * A fiscal year. The government's runs from Shrawan 1 to the last day of Asar the next year:
 * `{ startYear: 2083, endYear: 2084, label: "2083/84" }`. One that starts in Baisakh is the
 * BS year: `{ startYear: 2083, endYear: 2083, label: "2083" }`.
 */
export interface FiscalYear {
  /** The BS year that holds the first day. */
  startYear: number;
  /** The BS year that holds the last day: startYear + 1, or startYear if it starts in Baisakh. */
  endYear: number;
  /**
   * startYear and the last two digits of endYear, as written in Nepal: "2083/84". Just
   * startYear, "2083", if both are the same year.
   */
  label: string;
}

/**
 * A fiscal quarter. With the default Shrawan start, 1 is Shrawan–Aswin, 2 Kartik–Poush,
 * 3 Magh–Chaitra and 4 Baisakh–Asar.
 */
export type FiscalQuarter = 1 | 2 | 3 | 4;

/**
 * A chaumasik, a four-month third of the fiscal year. With the default Shrawan start these are
 * the government's reporting periods: 1 is Shrawan–Kartik, 2 Mangsir–Falgun and 3 Chaitra–Asar.
 */
export type Chaumasik = 1 | 2 | 3;

/** Shrawan, when the government's fiscal year starts: the default fiscalYearStartMonth. */
const DEFAULT_FISCAL_YEAR_START_MONTH = 4;

/** The fiscalYearStartMonth from FiscalYearOptions, after checking it. */
function fiscalYearStartMonth(options: FiscalYearOptions | undefined): number {
  const month = options?.fiscalYearStartMonth ?? DEFAULT_FISCAL_YEAR_START_MONTH;
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(
      `fiscalYearStartMonth must be 1 (Baisakh) to 12 (Chaitra), got ${String(month)}`,
    );
  }
  return month;
}

/** The BS year in which the fiscal year containing month `month` of `year` starts. */
function fiscalStartYear(year: number, month: number, startMonth: number): number {
  return month >= startMonth ? year : year - 1;
}

/** Months since the fiscal year's first month, 0–11, of a BS month 1–12. */
function fiscalMonthOf(month: number, startMonth: number): number {
  return (month - startMonth + 12) % 12;
}

/**
 * The day number of day 1 of a month of the fiscal year that starts in month `startMonth` of
 * `startYear`, counting the first month as 0, so 12 is the first month of the next fiscal year.
 * -Infinity before the table and Infinity after it, where the day isn't known. Either one makes
 * periodDays throw, and isSame still works because for each unit only one period starts before
 * the table.
 */
function fiscalMonthStartDay(startYear: number, startMonth: number, fiscalMonth: number): number {
  // Count months from year 0, as addMonths does, so a year boundary is a multiple of 12.
  const index = startYear * 12 + (startMonth - 1) + fiscalMonth;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  if (year < FIRST_YEAR) return -Infinity;
  // Baisakh 1 after the last year is known: it's the day after the table, where the last
  // period ends if it doesn't cross into the next BS year.
  if (year === LAST_YEAR + 1 && month === 1) return TOTAL_DAYS;
  if (year > LAST_YEAR) return Infinity;
  return bsToDays(year, month, 1);
}

const MINUTE_MS = 60_000;

/** The offset in ms from InstantOptions, or undefined for Nepal's own offset. */
function overrideOffsetMs(options: InstantOptions | undefined): number | undefined {
  const offsetMinutes = options?.offsetMinutes;
  if (offsetMinutes === undefined) return undefined;
  if (!Number.isInteger(offsetMinutes) || Math.abs(offsetMinutes) >= 24 * 60) {
    throw new RangeError(
      `offsetMinutes must be a whole number of minutes from -1439 to 1439, got ${offsetMinutes}`,
    );
  }
  return offsetMinutes * MINUTE_MS;
}

function formatInstant(ms: number, as: InstantFormat): Date | string | number {
  switch (as) {
    case "date":
      return new Date(ms);
    case "iso":
      return new Date(ms).toISOString();
    case "ms":
      return ms;
    default:
      throw new RangeError(`as must be "date", "iso" or "ms", got ${JSON.stringify(as)}`);
  }
}

/**
 * A half-open span of AD calendar dates as YYYY-MM-DD strings, for DATE columns: it includes
 * `start` and excludes `end`, the day after the last one. Query with `>= start AND < end`.
 */
export interface AdDateRange {
  start: string;
  end: string;
}

/** The AD date of a day number as YYYY-MM-DD. Works one past the table too, for range ends. */
function adDateString(days: number): string {
  return new Date(EPOCH_AD_MS + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The range from the start of day `firstDay` to the start of day `nextDay`. */
function dayRange<F extends InstantFormat>(
  firstDay: number,
  nextDay: number,
  options: RangeOptions<F> | undefined,
): InstantRange<InstantFormatTypes[F]> {
  const offsetMs = overrideOffsetMs(options);
  const as = options?.as ?? "date";
  // TypeScript can't follow the switch in formatInstant back to F, so assert the result type.
  return {
    start: formatInstant(daysToStartInstant(firstDay, offsetMs), as),
    end: formatInstant(daysToStartInstant(nextDay, offsetMs), as),
  } as InstantRange<InstantFormatTypes[F]>;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** The units NepaliDate can add, as they appear in error messages. */
type ArithmeticUnit = "days" | "weeks" | "months" | "years";

/** Throws TypeError unless `value` is a NepaliDate; returns it for chaining. */
function checkDate(value: NepaliDate, method: string): NepaliDate {
  if (!(value instanceof NepaliDate)) {
    throw new TypeError(`${method} takes a NepaliDate; use NepaliDate.parse for strings`);
  }
  return value;
}

/**
 * The date that wins `beats` against all others, from dates passed separately or as one array.
 * Earlier dates win ties, because `beats` must be strictly better.
 */
function pickDate(
  args: readonly NepaliDate[] | readonly [readonly NepaliDate[]],
  method: "min" | "max",
  beats: (candidate: NepaliDate, best: NepaliDate) => boolean,
): NepaliDate {
  const dates: readonly NepaliDate[] =
    args.length === 1 && Array.isArray(args[0]) ? args[0] : (args as readonly NepaliDate[]);
  if (dates.length === 0) {
    throw new RangeError(`${method} needs at least one date`);
  }
  let best = checkDate(dates[0], method);
  for (let i = 1; i < dates.length; i++) {
    if (beats(checkDate(dates[i], method), best)) best = dates[i];
  }
  return best;
}

function checkWholeNumber(amount: number, unit: ArithmeticUnit): void {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`${unit} must be a whole number, got ${String(amount)}`);
  }
}

/** An age, from NepaliDate.age: full years, then full months, then days. */
export interface Age {
  years: number;
  /** Full months after the years, 0–11. */
  months: number;
  /** Days after the years and months, 0 to one less than the length of a month. */
  days: number;
}

/**
 * The number of full months from `earlier` to `later`, which must not be before it: the most
 * that `earlier.addMonths` can add without passing `later`.
 */
function fullMonthsBetween(earlier: NepaliDate, later: NepaliDate): number {
  const months = later.year * 12 + later.month - (earlier.year * 12 + earlier.month);
  // Adding that many months lands in later's month, on the same day or its last day if shorter.
  const landingDay = Math.min(earlier.day, daysInMonth(later.year, later.month));
  return landingDay > later.day ? months - 1 : months;
}

export class NepaliDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;

  /** Day number since Baisakh 1 of FIRST_YEAR. Non-enumerable, so it stays out of keys, spreads and logs. */
  declare private readonly days: number;

  constructor(year: number, month: number, day: number) {
    Object.defineProperty(this, "days", { value: bsToDays(year, month, day), enumerable: false });
    this.year = year;
    this.month = month;
    this.day = day;
    Object.freeze(this);
  }

  // -------------factories---------------
  static fromDays(days: number): NepaliDate {
    const { year, month, day } = daysToBs(days);
    return new NepaliDate(year, month, day);
  }

  /**
   * Converts an AD date to BS. Takes numbers, or a year-first string such as
   * "2026-10-12", "2026/10/12", "2026.10.12" or "2026 10 12", in 0–9 or Devanagari digits
   * (२०२६-१०-१२).
   */
  static fromAd(text: string): NepaliDate;
  static fromAd(year: number, month: number, day: number): NepaliDate;
  static fromAd(yearOrText: number | string, month?: number, day?: number): NepaliDate {
    if (typeof yearOrText === "string") {
      return NepaliDate.fromDays(adToDays(...parseYearFirst(yearOrText, "AD")));
    }
    return NepaliDate.fromDays(adToDays(yearOrText, month as number, day as number));
  }

  /**
   * The date in Nepal at a moment in time, whatever the server's time zone. Takes a Date,
   * epoch milliseconds, or an ISO 8601 string with Z or an offset such as
   * "2026-10-18T10:30:00Z" or "2026-10-18T16:15:00+05:45".
   * Pass `offsetMinutes` to read the date at a fixed UTC offset instead of Nepal's.
   */
  static fromInstant(instant: Date | string | number, options?: InstantOptions): NepaliDate {
    const ms = toEpochMs(instant);
    const offsetMs = overrideOffsetMs(options) ?? nepalOffsetMs(ms);
    const days = instantToDays(ms, offsetMs);
    if (days < 0 || days >= TOTAL_DAYS) {
      const date = new Date(ms + offsetMs).toISOString().slice(0, 10);
      throw new RangeError(
        `${new Date(ms).toISOString()} falls on AD ${date}, outside the supported range ` +
          `${NepaliDate.MIN_DATE.toAdString()} to ${NepaliDate.MAX_DATE.toAdString()}`,
      );
    }
    return NepaliDate.fromDays(days);
  }

  /**
   * Today's date in Nepal, whatever the server's time zone. On a UTC server the date
   * changes at 18:15 UTC. Pass `offsetMinutes` for today's date at another fixed offset.
   * Throws RangeError after the last supported date (2086-12-30).
   */
  static today(options?: InstantOptions): NepaliDate {
    return NepaliDate.fromInstant(Date.now(), options);
  }

  /**
   * The span of time from the start of `from` to the end of `to`, both whole days in Nepal and
   * both included. Half-open like NepaliDate#range: query with `>= start AND < end`.
   * Pass `offsetMinutes` for a fixed UTC offset instead, and `as` to get the bounds as ISO
   * strings or epoch ms. Throws RangeError if `to` is before `from`.
   */
  static rangeBetween<F extends InstantFormat = "date">(
    from: NepaliDate,
    to: NepaliDate,
    options?: RangeOptions<F>,
  ): InstantRange<InstantFormatTypes[F]> {
    const [first, next] = NepaliDate.spanDays(from, to, "rangeBetween");
    return dayRange(first, next, options);
  }

  /**
   * The AD dates from `from` to `to`, both included, for DATE columns: `start` is the AD date
   * of `from` and `end` the day after `to`, so query with `>= start AND < end`. No time zone
   * is involved. Throws RangeError if `to` is before `from`.
   */
  static adRangeBetween(from: NepaliDate, to: NepaliDate): AdDateRange {
    const [first, next] = NepaliDate.spanDays(from, to, "adRangeBetween");
    return { start: adDateString(first), end: adDateString(next) };
  }

  /**
   * Every date from `from` to `to`, both included, oldest first: one entry per day for a daily
   * report. Throws RangeError if `to` is before `from`.
   */
  static eachDay(from: NepaliDate, to: NepaliDate): NepaliDate[] {
    const [first, next] = NepaliDate.spanDays(from, to, "eachDay");
    return Array.from({ length: next - first }, (_, i) => NepaliDate.fromDays(first + i));
  }

  /**
   * The first day of every month from the month of `from` to the month of `to`, both included,
   * oldest first: one entry per month for a monthly report, e.g. with `.range("month")` for each.
   * Throws RangeError if `to` is before `from`.
   */
  static eachMonth(from: NepaliDate, to: NepaliDate): NepaliDate[] {
    NepaliDate.spanDays(from, to, "eachMonth");
    // Count months from year 0, as addMonths does, so a year boundary is a multiple of 12.
    const first = from.year * 12 + (from.month - 1);
    const last = to.year * 12 + (to.month - 1);
    return Array.from({ length: last - first + 1 }, (_, i) => {
      const index = first + i;
      return new NepaliDate(Math.floor(index / 12), (index % 12) + 1, 1);
    });
  }

  /** Day numbers of `from` and of the day after `to`, after checking both. */
  private static spanDays(from: NepaliDate, to: NepaliDate, method: string): [number, number] {
    if (!(from instanceof NepaliDate) || !(to instanceof NepaliDate)) {
      throw new TypeError(
        `${method} takes two NepaliDate instances; use NepaliDate.parse for strings`,
      );
    }
    if (to.days < from.days) {
      throw new RangeError(`${method} needs from on or before to, got ${from} and ${to}`);
    }
    return [from.days, to.days + 1];
  }

  /**
   * Reads a year-first BS date such as "2083-06-26", "2083/06/26", "2083.6.26" or "2083 06 26",
   * with one kind of separator throughout, in 0–9 or Devanagari digits (२०८३-०६-२६).
   * Throws RangeError for any other format or an impossible date.
   */
  static parse(text: string): NepaliDate;
  /**
   * Reads a BS date written with a pattern of NepaliDate#format tokens, such as
   * `parse("26 Asoj 2083", "D MMMM YYYY")`. Month names can be in any common spelling, English
   * or Nepali, in any case; YY is read as 20YY; digits can be 0–9 or Devanagari. In the
   * pattern, "-", "/" and "." each match any of the three.
   *
   * Strict by default: the whole text must match, MM and DD need two digits, the separators
   * must all be the same, and a weekday (dddd, ddd or d) must be the date's real weekday.
   * Pass `{ strict: false }` to relax all four. Throws RangeError if the text doesn't match
   * or the date is impossible.
   */
  static parse(text: string, pattern: string, options?: ParseOptions): NepaliDate;
  static parse(text: string, pattern?: string, options?: ParseOptions): NepaliDate {
    // Only a string is a pattern, so dates.map(NepaliDate.parse), which passes an index and the
    // array as extra arguments, keeps reading year-first dates.
    if (typeof pattern !== "string") {
      return new NepaliDate(...parseYearFirst(text, "BS"));
    }
    const { year, month, day, weekday } = parseWithPattern(text, pattern, options);
    const date = new NepaliDate(year, month, day);
    if (weekday !== undefined && (options?.strict ?? true) && weekday !== date.dayOfWeek) {
      const names = LOCALES.en.weekdays;
      throw new RangeError(
        `${JSON.stringify(text)} says ${names[weekday]}, but ${date} is a ${names[date.dayOfWeek]}`,
      );
    }
    return date;
  }

  // ----------calendar info----------
  /** The first supported date (Baisakh 1, FIRST_YEAR). */
  static readonly MIN_DATE: NepaliDate = NepaliDate.fromDays(0);
  /** The last supported date (the last day of Chaitra, LAST_YEAR). */
  static readonly MAX_DATE: NepaliDate = NepaliDate.fromDays(TOTAL_DAYS - 1);

  /** Days in a BS month (29–32). Throws RangeError for an unsupported year or invalid month. */
  static daysInMonth(year: number, month: number): number {
    return daysInMonth(year, month);
  }

  /** Days in a BS year (365 or 366). Throws RangeError for an unsupported year. */
  static daysInYear(year: number): number {
    return daysInYear(year);
  }

  /** Whether a BS date exists and is inside the supported range. Never throws. */
  static isValid(year: number, month: number, day: number): boolean {
    return isValidBs(year, month, day);
  }

  // ----------getters----------

  get dayOfWeek(): number {
    return (this.days + EPOCH_WEEKDAY) % 7;
  }
  get dayOfYear(): number {
    return this.days - YEAR_START[this.year - FIRST_YEAR] + 1;
  }
  get daysInMonth(): number {
    return daysInMonth(this.year, this.month);
  }
  get daysInYear(): number {
    return daysInYear(this.year);
  }
  /**
   * The fiscal year this date falls in. The government's starts on Shrawan 1, so Baisakh to Asar
   * belong to the fiscal year that began the year before: 2083-04-01 and 2084-03-32 are both in
   * `{ startYear: 2083, endYear: 2084, label: "2083/84" }`. Pass `fiscalYearStartMonth` for a
   * fiscal year that starts in another month: with 1, Baisakh, it's the BS year, labelled "2083".
   * Returns a new object on every call. For its first and last days and its span of time, pass
   * "fiscalYear" to startOf, endOf, range and adRange, with the same options.
   */
  fiscalYear(options?: FiscalYearOptions): FiscalYear {
    const startMonth = fiscalYearStartMonth(options);
    const startYear = fiscalStartYear(this.year, this.month, startMonth);
    const endYear = startMonth === 1 ? startYear : startYear + 1;
    const label = endYear === startYear ? String(startYear) : `${startYear}/${pad2(endYear % 100)}`;
    return { startYear, endYear, label };
  }
  /**
   * The quarter of its fiscal year this date falls in, 1 to 4. With the government's fiscal year
   * they're Shrawan–Aswin, Kartik–Poush, Magh–Chaitra and Baisakh–Asar, and quarter 4 belongs
   * to the fiscal year that began the year before, as fiscalYear says. Pass
   * `fiscalYearStartMonth` to count from another month. For its first and last days and its span
   * of time, pass "fiscalQuarter" to startOf, endOf, range and adRange, with the same options.
   */
  fiscalQuarter(options?: FiscalYearOptions): FiscalQuarter {
    const fiscalMonth = fiscalMonthOf(this.month, fiscalYearStartMonth(options));
    return (Math.floor(fiscalMonth / 3) + 1) as FiscalQuarter;
  }
  /**
   * The chaumasik, or four-month third of its fiscal year, this date falls in, 1 to 3. With the
   * government's fiscal year they're its reporting periods Shrawan–Kartik, Mangsir–Falgun and
   * Chaitra–Asar; chaumasik 3 runs from Chaitra into the next BS year and belongs to the fiscal
   * year that began in the earlier one, as fiscalYear says. Pass `fiscalYearStartMonth` to count
   * from another month. For its first and last days and its span of time, pass "chaumasik" to
   * startOf, endOf, range and adRange, with the same options.
   */
  chaumasik(options?: FiscalYearOptions): Chaumasik {
    const fiscalMonth = fiscalMonthOf(this.month, fiscalYearStartMonth(options));
    return (Math.floor(fiscalMonth / 4) + 1) as Chaumasik;
  }

  // ----------comparison----------
  /**
   * -1 if `a` is earlier than `b`, 1 if it's later, 0 if they're the same date. Sorts dates
   * oldest first when passed to sort: `dates.sort(NepaliDate.compare)`. For newest first, use
   * `dates.sort((a, b) => NepaliDate.compare(b, a))`.
   */
  static compare(a: NepaliDate, b: NepaliDate): -1 | 0 | 1 {
    const difference = checkDate(a, "compare").days - checkDate(b, "compare").days;
    return difference < 0 ? -1 : difference > 0 ? 1 : 0;
  }
  /**
   * The earliest of the given dates, passed separately or as one array: `NepaliDate.min(a, b)`
   * or `NepaliDate.min(dates)`. Use the array form for long lists, which can be too long to
   * spread into arguments. Returns one of the given dates, the first if several are equal.
   * Throws RangeError if there are none.
   */
  static min(dates: readonly NepaliDate[]): NepaliDate;
  static min(...dates: NepaliDate[]): NepaliDate;
  static min(...args: NepaliDate[] | [readonly NepaliDate[]]): NepaliDate {
    return pickDate(args, "min", (candidate, best) => candidate.days < best.days);
  }
  /**
   * The latest of the given dates, passed separately or as one array, like NepaliDate.min.
   * Returns one of the given dates, the first if several are equal. Throws RangeError if there
   * are none.
   */
  static max(dates: readonly NepaliDate[]): NepaliDate;
  static max(...dates: NepaliDate[]): NepaliDate;
  static max(...args: NepaliDate[] | [readonly NepaliDate[]]): NepaliDate {
    return pickDate(args, "max", (candidate, best) => candidate.days > best.days);
  }
  /** Whether this date is earlier than `other`. */
  isBefore(other: NepaliDate): boolean {
    return this.days < checkDate(other, "isBefore").days;
  }
  /** Whether this date is later than `other`. */
  isAfter(other: NepaliDate): boolean {
    return this.days > checkDate(other, "isAfter").days;
  }
  /** Whether this is the same date as `other`. Use this rather than ===, which compares objects. */
  isEqual(other: NepaliDate): boolean {
    return this.days === checkDate(other, "isEqual").days;
  }
  /**
   * Whether this date and `other` fall in the same period of a RangeUnit: 2083-07-01 and
   * 2083-07-30 are the same month but not the same week, and 2083-12-30 and 2084-01-01 are the
   * same fiscal year but not the same year. Weeks start on Sunday unless `weekStartsOn` says
   * otherwise, and fiscal years in Shrawan unless `fiscalYearStartMonth` does.
   */
  isSame(other: NepaliDate, unit: RangeUnit, options?: PeriodOptions): boolean {
    checkDate(other, "isSame");
    return this.periodBounds(unit, options)[0] === other.periodBounds(unit, options)[0];
  }
  /**
   * Whether this date is from `from` to `to`, both included, like NepaliDate.rangeBetween.
   * Throws RangeError if `to` is before `from`.
   */
  isBetween(from: NepaliDate, to: NepaliDate): boolean {
    const [first, next] = NepaliDate.spanDays(from, to, "isBetween");
    return this.days >= first && this.days < next;
  }

  // ----------differences----------
  /**
   * The number of days from `other` to this date: positive if this date is later, negative if
   * it's earlier, 0 for the same date. `a.diffInDays(b)` is like `a - b`, and
   * `b.addDays(a.diffInDays(b))` is `a`.
   */
  diffInDays(other: NepaliDate): number {
    return this.days - checkDate(other, "diffInDays").days;
  }
  /**
   * The number of full months from `other` to this date, negative if this date is earlier.
   * Months are counted as addMonths adds them: 2083-01-15 to 2083-02-14 is 0 months and to
   * 2083-02-15 is 1, and a month from a day that the next month lacks ends on its last day, so
   * 2056-05-32 to 2056-06-30 is 1 month (Aswin 2056 has 30 days). Counted from the earlier date,
   * so swapping the dates only flips the sign.
   */
  diffInMonths(other: NepaliDate): number {
    return this.fullMonthSpans(checkDate(other, "diffInMonths"), 1);
  }
  /**
   * The number of full years from `other` to this date, negative if this date is earlier: an
   * age, for a birth date. Years are counted as addYears adds them, so 2083-06-26 to 2084-06-25
   * is 0 years and to 2084-06-26 is 1. Counted from the earlier date, so swapping the dates only
   * flips the sign.
   */
  diffInYears(other: NepaliDate): number {
    return this.fullMonthSpans(checkDate(other, "diffInYears"), 12);
  }
  /** Full spans of `months` months from `other` to this date, negative if this date is earlier. */
  private fullMonthSpans(other: NepaliDate, months: 1 | 12): number {
    // 0 - n rather than -n, which would give -0 when n is 0.
    if (this.days < other.days) return 0 - other.fullMonthSpans(this, months);
    // addMonths only moves forward as the months increase, so whole years are whole 12 months.
    return Math.floor(fullMonthsBetween(other, this) / months);
  }
  /**
   * The age on `onDate` of someone born on `birthDate`: full years, then full months, then days,
   * as `{ years: 27, months: 1, days: 11 }`. `onDate` defaults to today in Nepal. Years and months
   * are counted as diffInYears and diffInMonths count them, so a birthday on a day the month
   * lacks comes on its last day: someone born on 2081-12-31 is 1 on 2082-12-30, the last day of
   * Chaitra 2082. Adding the years and months to `birthDate` in one addMonths call, then the
   * days, gives `onDate`. Throws RangeError if `birthDate` is after `onDate`.
   */
  static age(birthDate: NepaliDate, onDate: NepaliDate = NepaliDate.today()): Age {
    checkDate(birthDate, "age");
    checkDate(onDate, "age");
    if (onDate.days < birthDate.days) {
      throw new RangeError(
        `age needs a birthDate on or before onDate, got ${birthDate} and ${onDate}`,
      );
    }
    const months = fullMonthsBetween(birthDate, onDate);
    return {
      years: Math.floor(months / 12),
      months: months % 12,
      days: onDate.days - birthDate.addMonths(months).days,
    };
  }

  // ----------arithmetic----------
  /**
   * The date `days` days later, or earlier for a negative number, as a new NepaliDate.
   * Throws RangeError if `days` isn't a whole number or the result is outside the supported range.
   */
  addDays(days: number): NepaliDate {
    return this.shiftDays(days, 1, "days");
  }
  /**
   * The date `weeks` weeks later, or earlier for a negative number, as a new NepaliDate. It falls
   * on the same weekday. Throws RangeError like addDays.
   */
  addWeeks(weeks: number): NepaliDate {
    return this.shiftDays(weeks, 7, "weeks");
  }
  /**
   * The same day `months` months later, or earlier for a negative number, as a new NepaliDate.
   * If that month is shorter, the result is its last day: Bhadra 32 + 1 month is Aswin 30 when
   * Aswin has 30 days, never Kartik 2. So adding then subtracting a month doesn't always return
   * the starting date, and `addMonths(2)` can differ from `addMonths(1).addMonths(1)`.
   * Throws RangeError like addDays.
   */
  addMonths(months: number): NepaliDate {
    return this.shiftMonths(months, 1, "months");
  }
  /**
   * The same month and day `years` years later, or earlier for a negative number, as a new
   * NepaliDate. Month lengths change from year to year, so the day is moved back to the month's
   * last day if needed, as in addMonths. Throws RangeError like addDays.
   */
  addYears(years: number): NepaliDate {
    return this.shiftMonths(years, 12, "years");
  }
  /**
   * The first day of the period of a RangeUnit containing this date, as a new NepaliDate:
   * Sunday for a week unless `weekStartsOn` says otherwise, Baisakh 1 for a year, and Shrawan 1
   * for a fiscal year unless `fiscalYearStartMonth` says otherwise. Fiscal quarters and
   * chaumasiks start every three and four months from there. "day" gives the same date. For the
   * moment a period starts, use range or startInstant.
   */
  startOf(unit: RangeUnit, options?: PeriodOptions): NepaliDate {
    return NepaliDate.fromDays(this.periodDays(unit, options)[0]);
  }
  /**
   * The last day of the period of a RangeUnit containing this date, as a new NepaliDate:
   * Saturday for a week starting on Sunday, day 29–32 of the month, the last day of Chaitra for
   * a year and of Asar for a fiscal year starting in Shrawan. A fiscal quarter or chaumasik ends
   * the day before the next one starts. "day" gives the same date. This is a date, not a time;
   * to query timestamps up to the end of a period, use range, whose end is the next period's
   * start.
   */
  endOf(unit: RangeUnit, options?: PeriodOptions): NepaliDate {
    return NepaliDate.fromDays(this.periodDays(unit, options)[1] - 1);
  }
  private shiftDays(amount: number, daysPerUnit: number, unit: ArithmeticUnit): NepaliDate {
    checkWholeNumber(amount, unit);
    const days = this.days + amount * daysPerUnit;
    if (days < 0 || days >= TOTAL_DAYS) throw this.outOfRange(amount, unit);
    return NepaliDate.fromDays(days);
  }
  private shiftMonths(amount: number, monthsPerUnit: number, unit: ArithmeticUnit): NepaliDate {
    checkWholeNumber(amount, unit);
    // Count months from year 0, so a year boundary is just a multiple of 12.
    const index = this.year * 12 + (this.month - 1) + amount * monthsPerUnit;
    const year = Math.floor(index / 12);
    const month = index - year * 12 + 1;
    if (year < FIRST_YEAR || year > LAST_YEAR) throw this.outOfRange(amount, unit);
    return new NepaliDate(year, month, Math.min(this.day, daysInMonth(year, month)));
  }
  private outOfRange(amount: number, unit: ArithmeticUnit): RangeError {
    const units = Math.abs(amount) === 1 ? unit.slice(0, -1) : unit;
    return new RangeError(
      `${this} plus ${amount} ${units} is outside the supported range ` +
        `${NepaliDate.MIN_DATE} to ${NepaliDate.MAX_DATE}`,
    );
  }

  // conversion
  toAd(): DateParts {
    return daysToAd(this.days);
  }
  /**
   * The moment this date starts in Nepal (midnight in Kathmandu), as a Date. Use it as the
   * lower bound when querying timestamps. Pass `offsetMinutes` for midnight at a fixed UTC
   * offset instead. Returns a new Date on every call.
   */
  startInstant(options?: InstantOptions): Date {
    return new Date(daysToStartInstant(this.days, overrideOffsetMs(options)));
  }
  /**
   * The span of time covered by the period of a RangeUnit containing this date in Nepal, for
   * querying timestamps: `WHERE created_at >= start AND created_at < end`. `end` is the start
   * of the next period, so nothing falls between two ranges. An end of 23:59:59 would miss
   * rows stamped 23:59:59.5. Pass `offsetMinutes` for a fixed UTC offset instead, and `as`
   * to get the bounds as ISO strings or epoch ms. Weeks start on Sunday unless `weekStartsOn`
   * says otherwise, and fiscal years in Shrawan unless `fiscalYearStartMonth` does.
   */
  range<F extends InstantFormat = "date">(
    unit: RangeUnit,
    options?: RangeOptions<F>,
  ): InstantRange<InstantFormatTypes[F]> {
    const [first, next] = this.periodDays(unit, options);
    return dayRange(first, next, options);
  }
  /**
   * The AD dates of the period of a RangeUnit containing this date, for DATE columns:
   * `WHERE sale_date >= start AND sale_date < end`. `end` is the AD date after the period's
   * last day. No time zone is involved, so the server's zone can't shift the dates. Weeks start
   * on Sunday unless `weekStartsOn` says otherwise, and fiscal years in Shrawan unless
   * `fiscalYearStartMonth` does.
   */
  adRange(unit: RangeUnit, options?: PeriodOptions): AdDateRange {
    const [first, next] = this.periodDays(unit, options);
    return { start: adDateString(first), end: adDateString(next) };
  }
  /** Day numbers of the first day of the period containing this date and of the day after it. */
  private periodDays(unit: RangeUnit, options?: PeriodOptions): [number, number] {
    const [first, next] = this.periodBounds(unit, options);
    // Days, months and years always fit. A few weeks at each end run past the table, which
    // starts and ends on a Saturday. So can a fiscal period that crosses from Chaitra into
    // Baisakh at either end: the fiscal year unless it starts in Baisakh, and its last quarter
    // or chaumasik unless that ends with Chaitra.
    if (first < 0 || next > TOTAL_DAYS) {
      throw new RangeError(
        `The ${this.periodName(unit, options)} containing ${this} runs outside the supported ` +
          `range ${NepaliDate.MIN_DATE} to ${NepaliDate.MAX_DATE}`,
      );
    }
    return [first, next];
  }
  /**
   * The name of the period of a RangeUnit containing this date, for error messages, such as
   * "week" or "third chaumasik of fiscal year 2086/87".
   */
  private periodName(unit: RangeUnit, options: PeriodOptions | undefined): string {
    const fiscalYear = `fiscal year ${this.fiscalYear(options).label}`;
    const ordinals = ["first", "second", "third", "fourth"];
    switch (unit) {
      case "fiscalQuarter":
        return `${ordinals[this.fiscalQuarter(options) - 1]} quarter of ${fiscalYear}`;
      case "chaumasik":
        return `${ordinals[this.chaumasik(options) - 1]} chaumasik of ${fiscalYear}`;
      case "fiscalYear":
        return fiscalYear;
      default:
        return unit;
    }
  }
  /** Like periodDays, without checking that a week fits in the table. For comparing dates. */
  private periodBounds(unit: RangeUnit, options?: PeriodOptions): [number, number] {
    const weekStartsOn = options?.weekStartsOn ?? 0;
    if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
      throw new RangeError(
        `weekStartsOn must be 0 (Sunday) to 6 (Saturday), got ${String(weekStartsOn)}`,
      );
    }
    const startMonth = fiscalYearStartMonth(options);
    switch (unit) {
      case "day":
        return [this.days, this.days + 1];
      case "week": {
        const first = this.days - ((this.dayOfWeek - weekStartsOn + 7) % 7);
        return [first, first + 7];
      }
      case "month": {
        const first = this.days - this.day + 1;
        return [first, first + this.daysInMonth];
      }
      case "fiscalQuarter":
        return this.fiscalPeriodBounds(3, startMonth);
      case "chaumasik":
        return this.fiscalPeriodBounds(4, startMonth);
      case "year":
        return [YEAR_START[this.year - FIRST_YEAR], YEAR_START[this.year - FIRST_YEAR + 1]];
      case "fiscalYear":
        return this.fiscalPeriodBounds(12, startMonth);
      default:
        throw new RangeError(
          `unit must be "day", "week", "month", "fiscalQuarter", "chaumasik", "year" or "fiscalYear", got ${JSON.stringify(unit)}`,
        );
    }
  }
  /**
   * Like periodBounds for the fiscal year starting in month `startMonth`, split into parts
   * `months` long: quarters for 3, chaumasiks for 4 and the whole fiscal year for 12.
   */
  private fiscalPeriodBounds(months: 3 | 4 | 12, startMonth: number): [number, number] {
    const first = Math.floor(fiscalMonthOf(this.month, startMonth) / months) * months;
    const startYear = fiscalStartYear(this.year, this.month, startMonth);
    return [
      fiscalMonthStartDay(startYear, startMonth, first),
      fiscalMonthStartDay(startYear, startMonth, first + months),
    ];
  }
  toAdString(): string {
    const { year, month, day } = this.toAd();
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }
  toString(): string {
    return `${this.year}-${pad2(this.month)}-${pad2(this.day)}`;
  }
  /**
   * Prints this date with a pattern of tokens:
   *
   * | Token  | Output             | Token  | Output              |
   * | ------ | ------------------ | ------ | ------------------- |
   * | `YYYY` | 2083               | `DD`   | 01–32               |
   * | `YY`   | 83                 | `D`    | 1–32                |
   * | `MMMM` | Baisakh … Chaitra  | `dddd` | Sunday … Saturday   |
   * | `MMM`  | Bai … Cha          | `ddd`  | Sun … Sat           |
   * | `MM`   | 01–12              | `d`    | 0–6 (0 = Sunday)    |
   * | `M`    | 1–12               | `[…]`  | its text, as is     |
   *
   * Everything else is copied as it is. Letters that are tokens are replaced even inside
   * words, so put words in square brackets: `format("[Today is] dddd")`.
   *
   * Pass `{ locale: "ne" }` for Nepali names and digits: `format("D MMMM", { locale: "ne" })`
   * gives "१ कार्तिक". Nepali month names aren't abbreviated, so MMM prints them in full.
   * Pass `digits` to choose the digits separately: `{ locale: "ne", digits: "latin" }` gives
   * "1 कार्तिक", and `{ digits: "devanagari" }` with YYYY-MM-DD gives "२०८३-०७-०१".
   */
  format(pattern: string, options?: FormatOptions): string {
    return formatDate(this, pattern, options);
  }
  toJSON(): string {
    return this.toString();
  }
}
