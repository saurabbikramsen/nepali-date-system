// Times the built package, as users run it: `npm run bench` builds first. It's JavaScript, not
// TypeScript, so type-checking doesn't need a build, and vitest.config.ts loads dist/ natively,
// because Vite's module runner slows calls between source modules and would skew the results.
import { test } from "vitest";
import { NepaliDate } from "../dist/esm/index.js";

// Each task does a million conversions, so the mean time per run that vitest reports is the
// time per million: what a report over a million rows spends converting dates. The inputs are
// 1,000 dates spread across the whole table, reused 1,000 times, so lookups aren't all in one
// year.
const SAMPLES = 1_000;
const ROUNDS = 1_000;

const allDays = NepaliDate.eachDay(NepaliDate.MIN_DATE, NepaliDate.MAX_DATE);
const dates = Array.from(
  { length: SAMPLES },
  (_, i) => allDays[Math.floor((i * allDays.length) / SAMPLES)],
);
const adParts = dates.map((date) => date.toAd());
const adStrings = dates.map((date) => date.toAdString());
const bsStrings = dates.map(String);
// Six hours into each day in Nepal, as epoch ms.
const instants = dates.map((date) => date.startInstant().getTime() + 6 * 3_600_000);

/** A benchmark that calls `convert` for each sample, ROUNDS times over. */
function million(convert) {
  return () => {
    for (let round = 0; round < ROUNDS; round++) {
      for (let i = 0; i < SAMPLES; i++) convert(i);
    }
  };
}

// Vitest's default 5-second test timeout is too short for eight sets of runs.
test("a million conversions", { timeout: 300_000 }, async ({ bench }) => {
  await bench.compare(
    bench(
      "AD to BS: fromAd(year, month, day)",
      million((i) => NepaliDate.fromAd(adParts[i].year, adParts[i].month, adParts[i].day)),
    ),
    bench(
      'AD to BS: fromAd("2026-10-12")',
      million((i) => NepaliDate.fromAd(adStrings[i])),
    ),
    bench(
      "BS to AD: toAd()",
      million((i) => dates[i].toAd()),
    ),
    bench(
      "BS to AD: toAdString()",
      million((i) => dates[i].toAdString()),
    ),
    bench(
      'BS: parse("2083-06-26")',
      million((i) => NepaliDate.parse(bsStrings[i])),
    ),
    bench(
      "Timestamp to BS: fromInstant(ms)",
      million((i) => NepaliDate.fromInstant(instants[i])),
    ),
    bench(
      'BS: format("D MMMM YYYY")',
      million((i) => dates[i].format("D MMMM YYYY")),
    ),
    bench(
      'BS: format("D MMMM YYYY", { locale: "ne" })',
      million((i) => dates[i].format("D MMMM YYYY", { locale: "ne" })),
    ),
    // A million conversions take long enough that five timed runs give stable numbers.
    { iterations: 5, warmupIterations: 1, time: 0, warmupTime: 0 },
  );
});
