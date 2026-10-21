import { MONTH_NAMES } from "./defined.js";
import type { DigitSystem } from "./digits.js";

/** The names of the built-in locales. */
export type LocaleName = "en" | "ne";

/**
 * Names and digits for one language. Months start at Baisakh, weekdays at Sunday. `digits` is
 * what NepaliDate#format uses unless it's given `digits` itself.
 *
 * Pass your own Locale wherever a locale name is accepted, for other languages or spellings.
 * Start from a built-in one to change only part of it:
 * `{ ...LOCALES.ne, months: ["वैशाख", "जेठ", "आषाढ", "श्रावण", ...] }`.
 */
export interface Locale {
  /** The digits numbers are printed with. */
  digits: DigitSystem;
  /** 12 month names, Baisakh first. */
  months: readonly string[];
  /** 12 short month names, for MMM. */
  monthsShort: readonly string[];
  /** 7 weekday names, Sunday first. */
  weekdays: readonly string[];
  /** 7 short weekday names, for ddd. */
  weekdaysShort: readonly string[];
}

/** Trimmed, lowercase and in standard Unicode form (NFC), so case and encoding don't matter. */
export const normalizeName = (name: string) => name.trim().normalize("NFC").toLowerCase();

const ENGLISH_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const NEPALI_MONTHS = [
  "बैशाख",
  "जेठ",
  "असार",
  "साउन",
  "भदौ",
  "असोज",
  "कार्तिक",
  "मंसिर",
  "पुस",
  "माघ",
  "फागुन",
  "चैत",
] as const;

/** Freezes a locale and its name lists, so code using the library can't change them for everyone. */
function freezeLocale(locale: Locale): Locale {
  Object.freeze(locale.months);
  Object.freeze(locale.monthsShort);
  Object.freeze(locale.weekdays);
  Object.freeze(locale.weekdaysShort);
  return Object.freeze(locale);
}

/**
 * The built-in locales: English, and Nepali with the everyday spellings used on printed
 * calendars and in calendar apps (साउन, not श्रावण). Frozen; spread one to make your own.
 */
export const LOCALES: Readonly<Record<LocaleName, Locale>> = Object.freeze({
  en: freezeLocale({
    digits: "latin",
    months: MONTH_NAMES,
    // BS months have no official abbreviations. The first three letters keep all twelve distinct.
    monthsShort: MONTH_NAMES.map((name) => name.slice(0, 3)),
    weekdays: ENGLISH_WEEKDAYS,
    weekdaysShort: ENGLISH_WEEKDAYS.map((name) => name.slice(0, 3)),
  }),
  ne: freezeLocale({
    digits: "devanagari",
    months: NEPALI_MONTHS,
    // Nepali month names are short and aren't usually abbreviated, so MMM prints them in full.
    monthsShort: NEPALI_MONTHS,
    weekdays: ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"],
    weekdaysShort: ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"],
  }),
});

function checkNames(locale: Locale, field: keyof Omit<Locale, "digits">, count: number): void {
  const names: unknown = locale[field];
  if (
    !Array.isArray(names) ||
    names.length !== count ||
    !names.every((name) => typeof name === "string" && name.trim() !== "")
  ) {
    throw new RangeError(`locale.${field} must be ${count} non-empty strings`);
  }
}

/** Throws if a name, ignoring case, stands for two different months or two different weekdays. */
function checkUnique(lists: readonly (readonly string[])[], what: string): void {
  const indexByName = new Map<string, number>();
  for (const list of lists) {
    list.forEach((name, index) => {
      const key = normalizeName(name);
      const existing = indexByName.get(key);
      if (existing !== undefined && existing !== index) {
        throw new RangeError(`locale uses ${JSON.stringify(name)} for two different ${what}`);
      }
      indexByName.set(key, index);
    });
  }
}

/**
 * The Locale for a built-in name, or a custom Locale after checking it: 12 months and 7 weekdays
 * as non-empty strings, valid digits, and no name used for two months or two weekdays (which
 * would make parsing ambiguous). Throws RangeError otherwise.
 */
export function resolveLocale(locale: LocaleName | Locale): Locale {
  if (typeof locale === "string") {
    if (!Object.prototype.hasOwnProperty.call(LOCALES, locale)) {
      throw new RangeError(
        `locale must be "en", "ne" or a Locale object, got ${JSON.stringify(locale)}`,
      );
    }
    return LOCALES[locale];
  }
  if (locale === null || typeof locale !== "object") {
    throw new RangeError(`locale must be "en", "ne" or a Locale object, got ${String(locale)}`);
  }
  if (locale.digits !== "latin" && locale.digits !== "devanagari") {
    throw new RangeError(
      `locale.digits must be "latin" or "devanagari", got ${JSON.stringify(locale.digits)}`,
    );
  }
  checkNames(locale, "months", 12);
  checkNames(locale, "monthsShort", 12);
  checkNames(locale, "weekdays", 7);
  checkNames(locale, "weekdaysShort", 7);
  checkUnique([locale.months, locale.monthsShort], "months");
  checkUnique([locale.weekdays, locale.weekdaysShort], "weekdays");
  return locale;
}
