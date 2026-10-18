import { FIRST_YEAR, FIRST_YEAR_START_AD, LAST_YEAR, MONTH_LENGTHS } from "../defined.js";

/** A calendar date with 1-based months, used for both BS and AD dates. */
export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const MS_PER_DAY = 86_400_000;

/** Day 0 is Baisakh 1 of FIRST_YEAR, as a UTC timestamp. */
const EPOCH_AD_MS = Date.UTC(
  FIRST_YEAR_START_AD.year,
  FIRST_YEAR_START_AD.month - 1,
  FIRST_YEAR_START_AD.day,
);

export const EPOCH_WEEKDAY = new Date(EPOCH_AD_MS).getUTCDay();

/**
 * YEAR_START[i] is the day number of Baisakh 1 of year FIRST_YEAR + i.
 * The last entry is one past the final day in the table.
 * Built from MONTH_LENGTHS when this module loads.
 */
export const YEAR_START: readonly number[] = (() => {
  const starts = [0];
  for (const months of MONTH_LENGTHS) {
    const daysInYear = months.reduce((sum, days) => sum + days, 0);
    starts.push(starts[starts.length - 1] + daysInYear);
  }
  return starts;
})();

/** Number of days the table covers. Valid day numbers are 0 to TOTAL_DAYS - 1. */
export const TOTAL_DAYS = YEAR_START[YEAR_START.length - 1];

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be an integer, got ${value}`);
  }
}

function assertSupportedYear(year: number): void {
  assertInteger(year, "year");
  if (year < FIRST_YEAR || year > LAST_YEAR) {
    throw new RangeError(
      `BS year ${year} is outside the supported range ${FIRST_YEAR}–${LAST_YEAR}`,
    );
  }
}

/** Days in a BS month (29–32). Throws RangeError for an unsupported year or invalid month. */
export function daysInMonth(year: number, month: number): number {
  assertSupportedYear(year);
  assertInteger(month, "month");
  if (month < 1 || month > 12) {
    throw new RangeError(`month must be 1–12, got ${month}`);
  }
  return MONTH_LENGTHS[year - FIRST_YEAR][month - 1];
}

/** Days in a BS year (365 or 366). Throws RangeError for an unsupported year. */
export function daysInYear(year: number): number {
  assertSupportedYear(year);
  return YEAR_START[year - FIRST_YEAR + 1] - YEAR_START[year - FIRST_YEAR];
}

/** Whether a BS date exists and is inside the supported range. Never throws. */
export function isValidBs(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year >= FIRST_YEAR &&
    year <= LAST_YEAR &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= MONTH_LENGTHS[year - FIRST_YEAR][month - 1]
  );
}

/** Converts a BS date to its day number. Throws RangeError for invalid or unsupported dates. */
export function bsToDays(year: number, month: number, day: number): number {
  const monthLength = daysInMonth(year, month);
  assertInteger(day, "day");
  if (day < 1 || day > monthLength) {
    throw new RangeError(`day must be 1–${monthLength} for BS ${year}-${month}, got ${day}`);
  }

  const months = MONTH_LENGTHS[year - FIRST_YEAR];
  let days = YEAR_START[year - FIRST_YEAR];
  for (let m = 0; m < month - 1; m++) days += months[m];
  return days + day - 1;
}

/** Converts a day number to a BS date. Throws RangeError outside 0 to TOTAL_DAYS - 1. */
export function daysToBs(days: number): DateParts {
  assertInteger(days, "days");
  if (days < 0 || days >= TOTAL_DAYS) {
    throw new RangeError(`day number ${days} is outside the supported range 0–${TOTAL_DAYS - 1}`);
  }

  // Binary search for the last year that starts on or before `days`.
  let lo = 0;
  let hi = MONTH_LENGTHS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (YEAR_START[mid] <= days) lo = mid;
    else hi = mid - 1;
  }

  const months = MONTH_LENGTHS[lo];
  let remaining = days - YEAR_START[lo];
  let m = 0;
  while (remaining >= months[m]) {
    remaining -= months[m];
    m++;
  }
  return { year: FIRST_YEAR + lo, month: m + 1, day: remaining + 1 };
}

/** Converts an AD (Gregorian) date to its day number. Throws RangeError for invalid or unsupported dates. */
export function adToDays(year: number, month: number, day: number): number {
  assertInteger(year, "year");
  assertInteger(month, "month");
  assertInteger(day, "day");
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  // Date.UTC rolls invalid dates over (Feb 30 → Mar 2), so confirm nothing moved.
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new RangeError(`${year}-${month}-${day} is not a valid AD date`);
  }
  const days = (ms - EPOCH_AD_MS) / MS_PER_DAY;
  if (days < 0 || days >= TOTAL_DAYS) {
    const first = daysToAd(0);
    const last = daysToAd(TOTAL_DAYS - 1);
    throw new RangeError(
      `AD ${year}-${month}-${day} is outside the supported range ` +
        `${first.year}-${first.month}-${first.day} to ${last.year}-${last.month}-${last.day}`,
    );
  }
  return days;
}

/** Converts a day number to an AD (Gregorian) date. Throws RangeError outside 0 to TOTAL_DAYS - 1. */
export function daysToAd(days: number): DateParts {
  assertInteger(days, "days");
  if (days < 0 || days >= TOTAL_DAYS) {
    throw new RangeError(`day number ${days} is outside the supported range 0–${TOTAL_DAYS - 1}`);
  }
  const date = new Date(EPOCH_AD_MS + days * MS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}
