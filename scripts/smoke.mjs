// Runs the built package the way an installed user would, through its own name, as ESM and as
// CommonJS. CI runs it on every Node version that package.json "engines" claims, so it uses no
// test tools. Run `npm run build` first, then `npm run smoke`.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import process from "node:process";
import { FIRST_YEAR, LAST_YEAR, LOCALES, NepaliDate } from "nepali-date-system";

const require = createRequire(import.meta.url);
const cjs = require("nepali-date-system");

for (const [build, { NepaliDate: ND }] of [
  ["ESM", { NepaliDate }],
  ["CommonJS", cjs],
]) {
  const d = new ND(2083, 6, 26);
  const k = ND.parse("2083-07-15");
  const check = (actual, expected) => assert.deepEqual(actual, expected, `${build} build`);

  // Converting and reading
  check(String(ND.fromAd("2026-10-12")), "2083-06-26");
  check(d.toAdString(), "2026-10-12");
  check(String(ND.parse("२०८३/६/२६")), "2083-06-26");
  check(String(ND.parse("26 Asoj 2083", "D MMMM YYYY")), "2083-06-26");
  check(String(ND.fromInstant("2026-10-17T18:15:00Z")), "2083-07-01");
  check([d.dayOfWeek, d.dayOfYear, d.daysInMonth], [1, 182, 31]);

  // Fiscal periods
  check(d.fiscalYear(), { startYear: 2083, endYear: 2084, label: "2083/84" });
  check([d.fiscalQuarter(), d.chaumasik()], [1, 1]);
  check(d.fiscalYear({ fiscalYearStartMonth: 1 }).label, "2083");

  // Ranges for queries
  check(d.range("fiscalYear", { as: "iso" }), {
    start: "2026-07-16T18:15:00.000Z",
    end: "2027-07-16T18:15:00.000Z",
  });
  check(ND.parse("2083-06-10").adRange("month"), { start: "2026-09-17", end: "2026-10-18" });

  // Arithmetic, differences and age
  check(String(ND.parse("2056-05-32").addMonths(1)), "2056-06-30");
  check(ND.parse("2084-03-14").diffInMonths(ND.parse("2083-01-15")), 13);
  check(ND.age(ND.parse("2056-05-15"), d), { years: 27, months: 1, days: 11 });
  check([k, d].sort(ND.compare).map(String), ["2083-06-26", "2083-07-15"]);

  // Formatting and serializing
  check(d.format("dddd, D MMMM YYYY", { locale: "ne" }), "सोमबार, २६ असोज २०८३");
  check(JSON.stringify({ due: d }), '{"due":"2083-06-26"}');

  // Errors
  assert.throws(() => new ND(2083, 2, 32), RangeError);
  assert.throws(() => d.isBefore("2083-01-01"), TypeError);
}

assert.deepEqual([FIRST_YEAR, LAST_YEAR, LOCALES.ne.months[3]], [1975, 2086, "साउन"]);
process.stdout.write(`Smoke test passed on Node ${process.version}, ESM and CommonJS\n`);
