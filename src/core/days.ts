import { FIRST_YEAR, LAST_YEAR, MONTH_LENGTHS } from "../defined.js";

/** A calendar date with 1-based months, used for both BS and AD dates. */
export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * Day 0 is BS FIRST_YEAR-01-01 (BS 2000-01-01), which is AD 1943-04-14.
 * Update this if FIRST_YEAR changes.
 */
const EPOCH_AD_MS = Date.UTC(1943, 3, 14);

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

/** Converts a BS date to its day number. Throws RangeError for invalid or unsupported dates. */
export function bsToDays(year: number, month: number, day: number): number {
  assertInteger(year, "year");
  assertInteger(month, "month");
  assertInteger(day, "day");
  if (year < FIRST_YEAR || year > LAST_YEAR) {
    throw new RangeError(
      `BS year ${year} is outside the supported range ${FIRST_YEAR}–${LAST_YEAR}`,
    );
  }
  if (month < 1 || month > 12) {
    throw new RangeError(`month must be 1–12, got ${month}`);
  }
  const months = MONTH_LENGTHS[year - FIRST_YEAR];
  const monthLength = months[month - 1];
  if (day < 1 || day > monthLength) {
    throw new RangeError(`day must be 1–${monthLength} for BS ${year}-${month}, got ${day}`);
  }

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
