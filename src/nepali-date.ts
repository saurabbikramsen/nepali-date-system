import {
  adToDays,
  bsToDays,
  type DateParts,
  daysInMonth,
  daysInYear,
  daysToAd,
  daysToBs,
  EPOCH_WEEKDAY,
  isValidBs,
  TOTAL_DAYS,
  YEAR_START,
} from "./core/days.js";
import { daysToStartInstant, instantToDays, nepalOffsetMs } from "./core/nepal-time.js";
import { FIRST_YEAR } from "./defined.js";

/**
 * A 4-digit year, then a month and day of one or two digits, all separated by the same
 * "-", "/" or ".". Year first only: day-first text like 26/06/2083 is ambiguous.
 */
const YEAR_FIRST_DATE = /^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})$/;

function parseYearFirst(text: string, calendar: "BS" | "AD"): [number, number, number] {
  const match = YEAR_FIRST_DATE.exec(text);
  if (!match) {
    const example = calendar === "BS" ? "2083-06-26" : "2026-10-12";
    throw new RangeError(
      `Expected a year-first ${calendar} date like ${example} (separated by -, / or .), got ${JSON.stringify(text)}`,
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
      const hint = YEAR_FIRST_DATE.test(instant)
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

/** The calendar periods that NepaliDate#range covers. */
export type RangeUnit = "day" | "month" | "year";

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
export interface RangeOptions<F extends InstantFormat = "date"> extends InstantOptions {
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
   * "2026-10-12", "2026/10/12" or "2026.10.12".
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
    if (!(from instanceof NepaliDate) || !(to instanceof NepaliDate)) {
      throw new TypeError(
        "rangeBetween takes two NepaliDate instances; use NepaliDate.parse for strings",
      );
    }
    if (to.days < from.days) {
      throw new RangeError(`rangeBetween needs from on or before to, got ${from} and ${to}`);
    }
    return dayRange(from.days, to.days + 1, options);
  }

  /**
   * Reads a year-first BS date such as "2083-06-26", "2083/06/26" or "2083.6.26".
   * Throws RangeError for any other format or an impossible date.
   */
  static parse(text: string): NepaliDate {
    return new NepaliDate(...parseYearFirst(text, "BS"));
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
   * The span of time covered by the day, month or year containing this date in Nepal, for
   * querying timestamps: `WHERE created_at >= start AND created_at < end`. `end` is the start
   * of the next period, so nothing falls between two ranges. An end of 23:59:59 would miss
   * rows stamped 23:59:59.5. Pass `offsetMinutes` for a fixed UTC offset instead, and `as`
   * to get the bounds as ISO strings or epoch ms.
   */
  range<F extends InstantFormat = "date">(
    unit: RangeUnit,
    options?: RangeOptions<F>,
  ): InstantRange<InstantFormatTypes[F]> {
    let first: number;
    let next: number;
    switch (unit) {
      case "day":
        first = this.days;
        next = first + 1;
        break;
      case "month":
        first = this.days - this.day + 1;
        next = first + this.daysInMonth;
        break;
      case "year":
        first = YEAR_START[this.year - FIRST_YEAR];
        next = YEAR_START[this.year - FIRST_YEAR + 1];
        break;
      default:
        throw new RangeError(`unit must be "day", "month" or "year", got ${JSON.stringify(unit)}`);
    }
    return dayRange(first, next, options);
  }
  toAdString(): string {
    const { year, month, day } = this.toAd();
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }
  toString(): string {
    return `${this.year}-${pad2(this.month)}-${pad2(this.day)}`;
  }
  toJSON(): string {
    return this.toString();
  }
}
