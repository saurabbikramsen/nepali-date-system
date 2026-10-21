import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIRST_YEAR, LAST_YEAR } from "../src/defined.js";
import { NepaliDate } from "../src/nepali-date.js";

const bs = (text: string) => NepaliDate.parse(text);
const daysIn = (year: number, month: number) => NepaliDate.daysInMonth(year, month);

/** Applies a chain such as ".addMonths(1).addMonths(-1)" to a date. */
function apply(date: NepaliDate, chain: string): NepaliDate {
  const step = /\.(addDays|addWeeks|addMonths|addYears)\((-?\d+)\)/g;
  expect(chain.replace(step, ""), `unreadable operation ${chain}`).toBe("");
  let result = date;
  for (const [, method, amount] of chain.matchAll(step)) {
    result = result[method as "addDays" | "addWeeks" | "addMonths" | "addYears"](Number(amount));
  }
  return result;
}

describe("the clamping table in the README", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const section = readme.split("### Adding months and years")[1]?.split("\n## ")[0] ?? "";
  const rows = [
    ...section.matchAll(
      /^\|\s*`(\d{4}-\d{2}-\d{2})`\s*\|\s*`([^`]+)`\s*\|\s*`(\d{4}-\d{2}-\d{2})`\s*\|/gm,
    ),
  ];

  it("has the examples", () => {
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });

  it.each(rows.map(([, date, chain, result]) => [date, chain, result]))(
    "%s%s gives %s",
    (date, chain, result) => {
      expect(apply(bs(date), chain).toString()).toBe(result);
    },
  );
});

describe("32-day months", () => {
  /** Every 32-day month in the table, as [year, month]. */
  const longMonths: [number, number][] = [];
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
    for (let month = 1; month <= 12; month++) {
      if (daysIn(year, month) === 32) longMonths.push([year, month]);
    }
  }

  it("exist in the table", () => {
    expect(longMonths.length).toBeGreaterThan(100);
  });

  it("move the 32nd to the last day of a shorter month, forwards and backwards", () => {
    for (const [year, month] of longMonths) {
      const date = new NepaliDate(year, month, 32);
      for (const amount of [1, -1, 12, -12]) {
        let result: NepaliDate;
        try {
          result = date.addMonths(amount);
        } catch {
          continue; // the first or last month of the table
        }
        const expectedDay = Math.min(32, daysIn(result.year, result.month));
        if (result.day !== expectedDay) {
          expect.fail(`${date} ${amount} months gave ${result}, expected day ${expectedDay}`);
        }
      }
    }
  });

  it("keep the 32nd when the new month also has 32 days", () => {
    expect(bs("2083-03-32").addYears(1).toString()).toBe("2084-03-32"); // Asar has 32 in both
    expect(bs("2029-03-32").addMonths(2).toString()).toBe("2029-05-32");
  });
});

describe("the Chaitra → Baisakh rollover", () => {
  it("moves the last day of Chaitra into Baisakh of the next year, for every year", () => {
    for (let year = FIRST_YEAR; year < LAST_YEAR; year++) {
      const chaitraEnd = new NepaliDate(year, 12, daysIn(year, 12));
      const result = chaitraEnd.addMonths(1);
      expect(result.toString(), String(year)).toBe(
        new NepaliDate(year + 1, 1, Math.min(chaitraEnd.day, daysIn(year + 1, 1))).toString(),
      );
      expect(chaitraEnd.addDays(1).toString(), String(year)).toBe(
        new NepaliDate(year + 1, 1, 1).toString(),
      );
    }
  });

  it("moves the last day of Baisakh back into Chaitra of the year before, for every year", () => {
    for (let year = FIRST_YEAR + 1; year <= LAST_YEAR; year++) {
      const baisakhEnd = new NepaliDate(year, 1, daysIn(year, 1));
      expect(baisakhEnd.addMonths(-1).toString(), String(year)).toBe(
        new NepaliDate(year - 1, 12, Math.min(baisakhEnd.day, daysIn(year - 1, 12))).toString(),
      );
      expect(new NepaliDate(year, 1, 1).addDays(-1).toString(), String(year)).toBe(
        new NepaliDate(year - 1, 12, daysIn(year - 1, 12)).toString(),
      );
    }
  });

  it("clamps when Baisakh is shorter than the Chaitra before it", () => {
    expect(bs("2057-12-31").addMonths(1).toString()).toBe("2058-01-30");
    expect(bs("2057-12-31").addDays(1).toString()).toBe("2058-01-01");
  });
});

describe("negative amounts", () => {
  it("go back across several year ends", () => {
    expect(bs("2083-01-31").addMonths(-13).toString()).toBe("2081-12-31");
    expect(bs("2083-01-31").addMonths(-25).toString()).toBe("2080-12-30"); // Chaitra 2080: 30
    expect(bs("2083-07-15").addYears(-100).toString()).toBe("1983-07-15");
  });

  it("clamp the same way as positive ones", () => {
    expect(bs("2083-03-32").addMonths(-1).toString()).toBe("2083-02-31");
    expect(bs("2083-03-32").addMonths(-3).toString()).toBe("2082-12-30");
    expect(bs("2082-03-32").addYears(-1).toString()).toBe("2081-03-31");
  });

  it("undo positive ones for days 1 to 29, which every month has", () => {
    for (const text of ["2083-07-29", "2083-03-29", "2056-05-15", "2083-12-01"]) {
      const date = bs(text);
      for (const amount of [1, 5, 13, 30]) {
        expect(date.addMonths(amount).addMonths(-amount), `${text} ±${amount}`).toEqual(date);
        expect(date.addMonths(-amount).addMonths(amount), `${text} ∓${amount}`).toEqual(date);
      }
    }
  });

  it("are rejected past the start of the table", () => {
    expect(() => NepaliDate.MIN_DATE.addMonths(-1)).toThrow(/plus -1 month is outside/);
    expect(() => NepaliDate.MIN_DATE.addYears(-1)).toThrow(/plus -1 year is outside/);
  });
});
