import { assertDigitSystem, type DigitSystem, toDevanagariDigits } from "./digits.js";
import { getLocale, type LocaleName } from "./locales.js";

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

/** Options for NepaliDate#format. */
export interface FormatOptions {
  /** The language for month and weekday names: "en" (the default) or "ne". */
  locale?: LocaleName;
  /**
   * The digits for numbers: "latin" (2083) or "devanagari" (२०८३). Defaults to the locale's:
   * Latin for "en", Devanagari for "ne". Digits inside [square brackets] are left as they are.
   */
  digits?: DigitSystem;
}

/** Prints a date with a pattern such as "YYYY-MM-DD" or "dddd, D MMMM YYYY". */
export function formatDate(fields: FormatFields, pattern: string, options?: FormatOptions): string {
  if (typeof pattern !== "string") {
    throw new TypeError(`format pattern must be a string, got ${typeof pattern}`);
  }
  const { year, month, day, dayOfWeek } = fields;
  const names = getLocale(options?.locale ?? "en");
  const digits = options?.digits ?? names.digits;
  assertDigitSystem(digits);
  const number = (text: string) => (digits === "devanagari" ? toDevanagariDigits(text) : text);

  return pattern.replace(TOKEN, (token: string, literal: string | undefined) => {
    if (literal !== undefined) return literal;
    switch (token) {
      case "YYYY":
        return number(String(year));
      case "YY":
        return number(pad2(year % 100));
      case "MMMM":
        return names.months[month - 1];
      case "MMM":
        return names.monthsShort[month - 1];
      case "MM":
        return number(pad2(month));
      case "M":
        return number(String(month));
      case "DD":
        return number(pad2(day));
      case "D":
        return number(String(day));
      case "dddd":
        return names.weekdays[dayOfWeek];
      case "ddd":
        return names.weekdaysShort[dayOfWeek];
      default: // "d"
        return number(String(dayOfWeek));
    }
  });
}
