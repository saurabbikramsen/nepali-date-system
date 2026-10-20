import { MONTH_NAMES } from "./defined.js";

/** The languages that NepaliDate#format can print names in. */
export type LocaleName = "en" | "ne";

/** Month and weekday names for one language. Months start at Baisakh, weekdays at Sunday. */
export interface Locale {
  months: readonly string[];
  monthsShort: readonly string[];
  weekdays: readonly string[];
  weekdaysShort: readonly string[];
}

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

/**
 * Names in English and in Nepali. The Nepali names are the everyday spellings used on printed
 * calendars and in calendar apps (साउन, not श्रावण).
 */
export const LOCALES: Readonly<Record<LocaleName, Locale>> = {
  en: {
    months: MONTH_NAMES,
    // BS months have no official abbreviations. The first three letters keep all twelve distinct.
    monthsShort: MONTH_NAMES.map((name) => name.slice(0, 3)),
    weekdays: ENGLISH_WEEKDAYS,
    weekdaysShort: ENGLISH_WEEKDAYS.map((name) => name.slice(0, 3)),
  },
  ne: {
    months: NEPALI_MONTHS,
    // Nepali month names are short and aren't usually abbreviated, so MMM prints them in full.
    monthsShort: NEPALI_MONTHS,
    weekdays: ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"],
    weekdaysShort: ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"],
  },
};

/** The names for a locale. Throws RangeError for an unknown locale. */
export function getLocale(name: LocaleName): Locale {
  if (!Object.prototype.hasOwnProperty.call(LOCALES, name)) {
    throw new RangeError(`locale must be "en" or "ne", got ${JSON.stringify(name)}`);
  }
  return LOCALES[name];
}
