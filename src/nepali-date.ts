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
import { daysToStartInstant, instantToDays } from "./core/nepal-time.js";
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
   */
  static fromInstant(instant: Date | string | number): NepaliDate {
    const ms = toEpochMs(instant);
    const days = instantToDays(ms);
    if (days < 0 || days >= TOTAL_DAYS) {
      const first = new Date(daysToStartInstant(0)).toISOString();
      const end = new Date(daysToStartInstant(TOTAL_DAYS)).toISOString();
      throw new RangeError(
        `${new Date(ms).toISOString()} is outside the supported range ${first} to ${end} (exclusive)`,
      );
    }
    return NepaliDate.fromDays(days);
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
