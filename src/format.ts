import { MONTH_NAMES } from "./defined.js";

/** The names a format pattern can print. */
interface FormatNames {
  months: readonly string[];
  monthsShort: readonly string[];
  weekdays: readonly string[];
  weekdaysShort: readonly string[];
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const ENGLISH: FormatNames = {
  months: MONTH_NAMES,
  // BS months have no official abbreviations. The first three letters keep all twelve distinct.
  monthsShort: MONTH_NAMES.map((name) => name.slice(0, 3)),
  weekdays: WEEKDAYS,
  weekdaysShort: WEEKDAYS.map((name) => name.slice(0, 3)),
};

/** The fields of a date that a pattern can print. */
export interface FormatFields {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
}

/**
 * Text in square brackets, or a token. Longer tokens come first, so MMMM is read before MM.
 * Everything else in a pattern is copied as it is.
 */
const TOKEN = /\[([^\]]*)]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|d/g;

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Prints a date with a pattern such as "YYYY-MM-DD" or "dddd, D MMMM YYYY". */
export function formatDate(fields: FormatFields, pattern: string): string {
  if (typeof pattern !== "string") {
    throw new TypeError(`format pattern must be a string, got ${typeof pattern}`);
  }
  const { year, month, day, dayOfWeek } = fields;
  const names = ENGLISH;
  return pattern.replace(TOKEN, (token: string, literal: string | undefined) => {
    if (literal !== undefined) return literal;
    switch (token) {
      case "YYYY":
        return String(year);
      case "YY":
        return pad2(year % 100);
      case "MMMM":
        return names.months[month - 1];
      case "MMM":
        return names.monthsShort[month - 1];
      case "MM":
        return pad2(month);
      case "M":
        return String(month);
      case "DD":
        return pad2(day);
      case "D":
        return String(day);
      case "dddd":
        return names.weekdays[dayOfWeek];
      case "ddd":
        return names.weekdaysShort[dayOfWeek];
      default: // "d"
        return String(dayOfWeek);
    }
  });
}
