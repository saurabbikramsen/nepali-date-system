import converter, { dateConfigMap } from "nepali-date-converter";
import { describe, expect, it } from "vitest";
import { type DateParts, daysToAd, daysToBs, YEAR_START } from "../src/core/days.js";
import { FIRST_YEAR, LAST_YEAR } from "../src/defined.js";

// The package is CommonJS with the class on `exports.default`. tsc and Node see it there;
// vitest unwraps it to the class itself.
const Converter = (converter.default ?? converter) as typeof converter.default;

const converterYears = Object.keys(dateConfigMap).map(Number);
const OVERLAP_FIRST_YEAR = Math.max(FIRST_YEAR, Math.min(...converterYears));
const OVERLAP_LAST_YEAR = Math.min(LAST_YEAR, Math.max(...converterYears));

/** A run of consecutive days, given as its first and last BS and AD dates. */
interface Difference {
  bs: [first: string, last: string];
  ad: [first: string, last: string];
}

/**
 * Every run of days where nepali-date-converter disagrees with this library, in either
 * direction. A new or vanished difference fails the test, so change this list deliberately.
 */
const KNOWN_DIFFERENCES: Difference[] = [
  // 2062 Baisakh/Jestha: ours 31/31, theirs 30/32. Ours is settled by 2005 nepalnews.com
  // datelines (Baisakh 31 = 2005-05-14, Jestha 1 = 2005-05-15) in fixtures/documented-dates.ts.
  { bs: ["2062-01-31", "2062-02-31"], ad: ["2005-05-14", "2005-06-14"] },
  // 2084–2086 are provisional in both tables and use different month lengths. Ours follows
  // Hamro Patro and four other libraries (see src/defined.ts).
  { bs: ["2084-03-01", "2084-03-32"], ad: ["2027-06-15", "2027-07-16"] },
  { bs: ["2084-05-01", "2084-10-30"], ad: ["2027-08-17", "2028-02-12"] },
  { bs: ["2085-01-01", "2085-01-31"], ad: ["2028-04-13", "2028-05-13"] },
  { bs: ["2085-06-01", "2085-06-31"], ad: ["2028-09-16", "2028-10-16"] },
  { bs: ["2085-11-30", "2085-12-30"], ad: ["2029-03-14", "2029-04-13"] },
  { bs: ["2086-02-01", "2086-02-32"], ad: ["2029-05-14", "2029-06-14"] },
  { bs: ["2086-04-01", "2086-04-32"], ad: ["2029-07-16", "2029-08-16"] },
  { bs: ["2086-07-01", "2086-08-30"], ad: ["2029-10-17", "2029-12-15"] },
  { bs: ["2086-10-01", "2086-10-30"], ad: ["2030-01-14", "2030-02-12"] },
];

const iso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const isoDate = ({ year, month, day }: DateParts) => iso(year, month, day);
/** nepali-date-converter returns 0-based months and calls the day `date`. */
const isoConverter = ({ year, month, date }: { year: number; month: number; date: number }) =>
  iso(year, month + 1, date);

/** Compares every day both libraries cover, BS → AD and AD → BS. */
function findDifferences(): Difference[] {
  const differences: Difference[] = [];
  let run: Difference | undefined;
  const start = YEAR_START[OVERLAP_FIRST_YEAR - FIRST_YEAR];
  const end = YEAR_START[OVERLAP_LAST_YEAR - FIRST_YEAR + 1];

  for (let days = start; days < end; days++) {
    const bsParts = daysToBs(days);
    const adParts = daysToAd(days);
    const bs = isoDate(bsParts);
    const ad = isoDate(adParts);
    const theirs = new Converter(bsParts.year, bsParts.month - 1, bsParts.day);
    const agrees =
      isoConverter(theirs.getBS()) === bs && // differs when the converter rolls a missing date over
      isoConverter(theirs.getAD()) === ad &&
      // fromAD reads the Date's local calendar fields, so build it in local time.
      isoConverter(
        Converter.fromAD(new Date(adParts.year, adParts.month - 1, adParts.day)).getBS(),
      ) === bs;

    if (agrees) {
      if (run) differences.push(run);
      run = undefined;
    } else if (run) {
      run.bs[1] = bs;
      run.ad[1] = ad;
    } else {
      run = { bs: [bs, bs], ad: [ad, ad] };
    }
  }
  if (run) differences.push(run);
  return differences;
}

describe("cross-check against nepali-date-converter", () => {
  it("covers BS 2000–2086, every year both libraries support", () => {
    expect([OVERLAP_FIRST_YEAR, OVERLAP_LAST_YEAR]).toEqual([2000, 2086]);
  });

  it("disagrees only on the known differences", () => {
    expect(findDifferences()).toEqual(KNOWN_DIFFERENCES);
  });
});
