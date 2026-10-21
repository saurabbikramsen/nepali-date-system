import { toLatinDigits } from "./digits.js";
import { TOKEN } from "./format.js";
import { type Locale, LOCALES, type LocaleName, resolveLocale } from "./locales.js";
import { MONTH_SPELLINGS, monthFromName } from "./month-names.js";

/** Options for NepaliDate.parse with a pattern. */
export interface ParseOptions {
  /**
   * A custom Locale whose month and weekday names should also be read. The built-in English and
   * Nepali names, in every common spelling, are always read; a custom locale's names take
   * priority over them. "en" and "ne" are accepted and change nothing.
   */
  locale?: LocaleName | Locale;
  /**
   * true (the default) to require the text to match the pattern exactly: MM and DD need two
   * digits, separators must all be the same, and a weekday must be the date's real weekday.
   * false to accept one-digit MM and DD, mixed separators, extra spaces, and any weekday.
   */
  strict?: boolean;
}

/** The parts read from a text. `weekday` is only set when the pattern has a weekday token. */
export interface ParsedParts {
  year: number;
  month: number;
  day: number;
  weekday?: number;
}

const normalize = (text: string) => toLatinDigits(text.normalize("NFC")).toLowerCase();
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Alternatives for a regular expression, longest first so "Chaitra" is tried before "Chait". */
const alternatives = (names: Iterable<string>) =>
  [...new Set(names)]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");

/** A locale's names, normalized, to their numbers: months 1–12, weekdays 0–6 (0 = Sunday). */
function namesByNumber(
  locales: readonly Locale[],
  kind: "months" | "weekdays",
): Map<string, number> {
  const short = kind === "months" ? "monthsShort" : "weekdaysShort";
  const offset = kind === "months" ? 1 : 0;
  return new Map(
    locales.flatMap((locale) =>
      [locale[kind], locale[short]].flatMap((names) =>
        names.map((name, index): [string, number] => [normalize(name), index + offset]),
      ),
    ),
  );
}

/** How to find and read month and weekday names: the regular expressions and lookups. */
interface NameReader {
  monthSource: string;
  weekdaySource: string;
  month(name: string): number | undefined;
  weekday(name: string): number | undefined;
}

const BUILT_IN_WEEKDAYS = namesByNumber(Object.values(LOCALES), "weekdays");

const BUILT_IN_NAMES: NameReader = {
  monthSource: `(${alternatives(MONTH_SPELLINGS)})`,
  weekdaySource: `(${alternatives(BUILT_IN_WEEKDAYS.keys())})`,
  month: monthFromName,
  weekday: (name) => BUILT_IN_WEEKDAYS.get(name),
};

/** The built-in names, plus a custom locale's names checked first. */
function nameReader(locale: LocaleName | Locale | undefined): NameReader {
  if (locale === undefined) return BUILT_IN_NAMES;
  const resolved = resolveLocale(locale);
  if (typeof locale === "string") return BUILT_IN_NAMES;
  const months = namesByNumber([resolved], "months");
  const weekdays = namesByNumber([resolved], "weekdays");
  return {
    monthSource: `(${alternatives([...months.keys(), ...MONTH_SPELLINGS])})`,
    weekdaySource: `(${alternatives([...weekdays.keys(), ...BUILT_IN_WEEKDAYS.keys()])})`,
    month: (name) => months.get(name) ?? monthFromName(name),
    weekday: (name) => weekdays.get(name) ?? BUILT_IN_WEEKDAYS.get(name),
  };
}

/** What each capture group in a compiled pattern holds. */
type Group =
  "separator" | "YYYY" | "YY" | "MMMM" | "MMM" | "MM" | "M" | "DD" | "D" | "dddd" | "ddd" | "d";

function tokenSource(
  token: Exclude<Group, "separator">,
  strict: boolean,
  names: NameReader,
): string {
  switch (token) {
    case "YYYY":
      return "(\\d{4})";
    case "YY":
      return "(\\d{2})";
    case "MM":
    case "DD":
      return strict ? "(\\d{2})" : "(\\d{1,2})";
    case "M":
    case "D":
      return "(\\d{1,2})";
    case "MMMM":
    case "MMM":
      return names.monthSource;
    case "dddd":
    case "ddd":
      return names.weekdaySource;
    default: // "d"
      return "([0-6])";
  }
}

/**
 * The regular expression source for literal text. Outside square brackets, "-", "/" and "."
 * each match any of the three. When not strict, a run of spaces matches any amount of space.
 */
function literalSource(text: string, strict: boolean, bracketed: boolean, groups: Group[]): string {
  let source = "";
  for (const part of normalize(text).match(/\s+|[^\s]/g) ?? []) {
    if (!bracketed && (part === "-" || part === "/" || part === ".")) {
      groups.push("separator");
      source += "([-/.])";
    } else if (!strict && /^\s+$/.test(part)) {
      source += "\\s+";
    } else {
      source += escapeRegExp(part);
    }
  }
  return source;
}

function compile(
  pattern: string,
  strict: boolean,
  names: NameReader,
): { regex: RegExp; groups: Group[] } {
  const groups: Group[] = [];
  let source = "";
  let last = 0;
  for (const match of pattern.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    source += literalSource(pattern.slice(last, index), strict, false, groups);
    if (match[1] !== undefined) {
      source += literalSource(match[1], strict, true, groups);
    } else {
      const token = match[0] as Exclude<Group, "separator">;
      groups.push(token);
      source += tokenSource(token, strict, names);
    }
    last = index + match[0].length;
  }
  source += literalSource(pattern.slice(last), strict, false, groups);

  const has = (...tokens: Group[]) => tokens.some((token) => groups.includes(token));
  if (!has("YYYY", "YY") || !has("MMMM", "MMM", "MM", "M") || !has("DD", "D")) {
    throw new RangeError(
      `parse pattern needs a year (YYYY or YY), a month (MMMM, MMM, MM or M) and a day (DD or D), got ${JSON.stringify(pattern)}`,
    );
  }
  const space = strict ? "" : "\\s*";
  return { regex: new RegExp(`^${space}${source}${space}$`, "i"), groups };
}

/** Reads the year, month, day and weekday from a text written with a format pattern. */
export function parseWithPattern(
  text: string,
  pattern: string,
  options?: ParseOptions,
): ParsedParts {
  if (typeof text !== "string") {
    throw new TypeError(`parse text must be a string, got ${typeof text}`);
  }
  const strict = options?.strict ?? true;
  const names = nameReader(options?.locale);
  const { regex, groups } = compile(pattern, strict, names);
  const match = regex.exec(normalize(text));
  if (!match) {
    throw new RangeError(
      `${JSON.stringify(text)} doesn't match the pattern ${JSON.stringify(pattern)}${strict ? " (strict)" : ""}`,
    );
  }

  const values: Partial<
    Record<"year" | "yearSuffix" | "month" | "day" | "weekday" | "separator", number | string>
  > = {};
  const set = (field: keyof typeof values, value: number | string) => {
    if (values[field] !== undefined && values[field] !== value) {
      // Allowed only when not strict, and only for separators.
      if (field === "separator" && !strict) return;
      const what = field === "separator" ? "separators" : `${field}s`;
      throw new RangeError(`${JSON.stringify(text)} gives two different ${what}`);
    }
    values[field] = value;
  };

  groups.forEach((group, i) => {
    const value = match[i + 1];
    switch (group) {
      case "separator":
        return set("separator", value);
      case "YYYY":
        return set("year", Number(value));
      case "YY":
        return set("yearSuffix", Number(value));
      case "MMMM":
      case "MMM":
        return set("month", names.month(value) as number);
      case "MM":
      case "M":
        return set("month", Number(value));
      case "DD":
      case "D":
        return set("day", Number(value));
      case "dddd":
      case "ddd":
        return set("weekday", names.weekday(value) as number);
      default: // "d"
        return set("weekday", Number(value));
    }
  });

  // YY is the last two digits of the year: checked against YYYY if both are given, read as
  // 20YY if it's alone. 1975–1999 need YYYY.
  if (values.yearSuffix !== undefined) {
    if (values.year === undefined) {
      values.year = 2000 + (values.yearSuffix as number);
    } else if ((values.year as number) % 100 !== values.yearSuffix) {
      throw new RangeError(`${JSON.stringify(text)} gives two different years`);
    }
  }

  return {
    year: values.year as number,
    month: values.month as number,
    day: values.day as number,
    ...(values.weekday === undefined ? {} : { weekday: values.weekday as number }),
  };
}
