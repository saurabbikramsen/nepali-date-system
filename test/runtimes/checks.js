// The checks every runtime test runs against the built package: Node (ESM and CommonJS), Deno,
// Bun, a Vite app in browsers and React Native. Plain JavaScript with no imports and no runtime
// APIs, so it runs unchanged everywhere. Pass it the package's exports; it throws an Error
// naming the first check that fails.

function same(actual, expected) {
  if (Object.is(actual, expected)) return true;
  if (typeof actual !== "object" || typeof expected !== "object") return false;
  if (actual === null || expected === null) return false;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  const keys = Object.keys(expected);
  if (Object.keys(actual).length !== keys.length) return false;
  return keys.every((key) => same(actual[key], expected[key]));
}

/** Runs every check against `lib`, the package's exports, labelling failures with `build`. */
export function runChecks(lib, build) {
  const { FIRST_YEAR, LAST_YEAR, LOCALES, NepaliDate: ND } = lib;
  let count = 0;
  const check = (name, actual, expected) => {
    count++;
    if (!same(actual, expected)) {
      throw new Error(
        `${build}: ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      );
    }
  };
  const throws = (name, fn, ErrorType) => {
    count++;
    try {
      fn();
    } catch (error) {
      if (error instanceof ErrorType) return;
      throw new Error(`${build}: ${name}: expected a ${ErrorType.name}, got ${error}`, {
        cause: error,
      });
    }
    throw new Error(`${build}: ${name}: expected a ${ErrorType.name}, but nothing was thrown`);
  };

  const d = new ND(2083, 6, 26);
  const k = ND.parse("2083-07-15");

  // Converting and reading
  check("fromAd", String(ND.fromAd("2026-10-12")), "2083-06-26");
  check("toAdString", d.toAdString(), "2026-10-12");
  check("parse Devanagari", String(ND.parse("२०८३/६/२६")), "2083-06-26");
  check("parse pattern", String(ND.parse("26 Asoj 2083", "D MMMM YYYY")), "2083-06-26");
  check("parse Nepali month", String(ND.parse("२६ असोज २०८३", "D MMMM YYYY")), "2083-06-26");
  check("fromInstant", String(ND.fromInstant("2026-10-17T18:15:00Z")), "2083-07-01");
  check("getters", [d.dayOfWeek, d.dayOfYear, d.daysInMonth], [1, 182, 31]);

  // Fiscal periods
  check("fiscalYear", d.fiscalYear(), { startYear: 2083, endYear: 2084, label: "2083/84" });
  check("fiscalQuarter", [d.fiscalQuarter(), d.chaumasik()], [1, 1]);
  check("fiscalYearStartMonth", d.fiscalYear({ fiscalYearStartMonth: 1 }).label, "2083");

  // Ranges for queries
  check("range", d.range("fiscalYear", { as: "iso" }), {
    start: "2026-07-16T18:15:00.000Z",
    end: "2027-07-16T18:15:00.000Z",
  });
  check("adRange", ND.parse("2083-06-10").adRange("month"), {
    start: "2026-09-17",
    end: "2026-10-18",
  });

  // Arithmetic, differences and age
  check("addMonths", String(ND.parse("2056-05-32").addMonths(1)), "2056-06-30");
  check("diffInMonths", ND.parse("2084-03-14").diffInMonths(ND.parse("2083-01-15")), 13);
  check("age", ND.age(ND.parse("2056-05-15"), d), { years: 27, months: 1, days: 11 });
  check("sort", [k, d].sort(ND.compare).map(String), ["2083-06-26", "2083-07-15"]);

  // Formatting and serializing
  check("format", d.format("dddd, D MMMM YYYY", { locale: "ne" }), "सोमबार, २६ असोज २०८३");
  check("toJSON", JSON.stringify({ due: d }), '{"due":"2083-06-26"}');

  // Errors
  throws("impossible date", () => new ND(2083, 2, 32), RangeError);
  throws("string argument", () => d.isBefore("2083-01-01"), TypeError);

  // Constants
  check("constants", [FIRST_YEAR, LAST_YEAR, LOCALES.ne.months[3]], [1975, 2086, "साउन"]);

  return count;
}
