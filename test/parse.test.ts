import { describe, expect, it } from "vitest";
import { YEAR_START } from "../src/core/days.js";
import { FIRST_YEAR } from "../src/defined.js";
import { NepaliDate } from "../src/nepali-date.js";

const parsed = (...args: Parameters<typeof NepaliDate.parse>) =>
  NepaliDate.parse(...args).toString();

describe("parse with a pattern: names", () => {
  it.each(["26 Asoj 2083", "26 Aswin 2083", "26 Ashwin 2083", "26 ASOJ 2083", "26 असोज 2083"])(
    "reads %j with D MMMM YYYY",
    (text) => {
      expect(parsed(text, "D MMMM YYYY")).toBe("2083-06-26");
    },
  );

  it("reads short month names and any spelling for MMM", () => {
    expect(parsed("1 Kar 2083", "D MMM YYYY")).toBe("2083-07-01");
    expect(parsed("1 Kartik 2083", "D MMM YYYY")).toBe("2083-07-01");
  });

  it("reads Nepali names with Devanagari digits", () => {
    expect(parsed("आइतबार, १ कार्तिक २०८३", "dddd, D MMMM YYYY")).toBe("2083-07-01");
    expect(parsed("२०८३-०७-०१", "YYYY-MM-DD")).toBe("2083-07-01");
  });

  it("prefers the longest spelling", () => {
    // "Chait" is a prefix of "Chaitra"; both are month 12.
    expect(parsed("Chaitra 30, 2083", "MMMM D, YYYY")).toBe("2083-12-30");
    expect(parsed("Chait 30, 2083", "MMMM D, YYYY")).toBe("2083-12-30");
  });

  it("rejects a month name it doesn't know", () => {
    expect(() => NepaliDate.parse("1 October 2083", "D MMMM YYYY")).toThrow(/doesn't match/);
  });
});

describe("parse with a pattern: separators", () => {
  it.each(["2083-07-01", "2083/07/01", "2083.07.01"])("reads %j with YYYY-MM-DD", (text) => {
    expect(parsed(text, "YYYY-MM-DD")).toBe("2083-07-01");
  });

  it("treats -, / and . in the pattern alike", () => {
    expect(parsed("2083-07-01", "YYYY/MM/DD")).toBe("2083-07-01");
    expect(parsed("01.07.2083", "DD-MM-YYYY")).toBe("2083-07-01");
  });

  it("requires the same separator throughout when strict", () => {
    expect(() => NepaliDate.parse("2083/07-01", "YYYY-MM-DD")).toThrow(
      /gives two different separators/,
    );
    expect(parsed("2083/07-01", "YYYY-MM-DD", { strict: false })).toBe("2083-07-01");
  });

  it("keeps separators inside square brackets exact", () => {
    expect(parsed("a-b 2083-07-01", "[a-b] YYYY-MM-DD")).toBe("2083-07-01");
    expect(() => NepaliDate.parse("a/b 2083-07-01", "[a-b] YYYY-MM-DD")).toThrow(RangeError);
  });
});

describe("parse with a pattern: strict and lenient", () => {
  it("requires two digits for MM and DD when strict", () => {
    expect(() => NepaliDate.parse("2083-7-1", "YYYY-MM-DD")).toThrow(/doesn't match/);
    expect(parsed("2083-7-1", "YYYY-MM-DD", { strict: false })).toBe("2083-07-01");
  });

  it("accepts one or two digits for M and D", () => {
    expect(parsed("2083-7-1", "YYYY-M-D")).toBe("2083-07-01");
    expect(parsed("2083-07-01", "YYYY-M-D")).toBe("2083-07-01");
    expect(parsed("2083-12-30", "YYYY-M-D")).toBe("2083-12-30");
  });

  it("requires the exact spacing when strict", () => {
    expect(() => NepaliDate.parse(" 1  Kartik 2083", "D MMMM YYYY")).toThrow(/doesn't match/);
    expect(parsed(" 1  Kartik 2083 ", "D MMMM YYYY", { strict: false })).toBe("2083-07-01");
  });

  it("checks the weekday when strict and ignores it when not", () => {
    expect(parsed("Sunday, 1 Kartik 2083", "dddd, D MMMM YYYY")).toBe("2083-07-01");
    expect(parsed("Sun 2083-07-01", "ddd YYYY-MM-DD")).toBe("2083-07-01");
    expect(parsed("0 2083-07-01", "d YYYY-MM-DD")).toBe("2083-07-01");
    expect(() => NepaliDate.parse("Monday, 1 Kartik 2083", "dddd, D MMMM YYYY")).toThrow(
      /says Monday, but 2083-07-01 is a Sunday/,
    );
    expect(parsed("Monday, 1 Kartik 2083", "dddd, D MMMM YYYY", { strict: false })).toBe(
      "2083-07-01",
    );
  });
});

describe("parse with a pattern: years, literals and repeats", () => {
  it("reads YY as 20YY", () => {
    expect(parsed("01.07.83", "DD.MM.YY")).toBe("2083-07-01");
    expect(parsed("01.01.00", "DD.MM.YY")).toBe("2000-01-01");
    expect(() => NepaliDate.parse("01.01.99", "DD.MM.YY")).toThrow(/outside the supported range/);
  });

  it("matches text in square brackets, ignoring case", () => {
    expect(parsed("Today is 1 Kartik 2083", "[Today is] D MMMM YYYY")).toBe("2083-07-01");
    expect(parsed("today is 1 Kartik 2083", "[Today is] D MMMM YYYY")).toBe("2083-07-01");
  });

  it("matches characters that are special in regular expressions literally", () => {
    expect(parsed("(2083) 07 01", "(YYYY) MM DD")).toBe("2083-07-01");
    expect(() => NepaliDate.parse("x2083) 07 01", "(YYYY) MM DD")).toThrow(RangeError);
  });

  it("requires repeated fields to agree", () => {
    expect(parsed("2083-07-01 (Kartik)", "YYYY-MM-DD (MMMM)")).toBe("2083-07-01");
    expect(() => NepaliDate.parse("2083-07-01 (Mangsir)", "YYYY-MM-DD (MMMM)")).toThrow(
      /gives two different months/,
    );
  });
});

describe("parse with a pattern: errors", () => {
  it("rejects text that doesn't match the whole pattern", () => {
    for (const text of ["2083-07-01 ", "x2083-07-01", "2083-07", "", "not a date"]) {
      expect(() => NepaliDate.parse(text, "YYYY-MM-DD"), text).toThrow(/doesn't match/);
    }
  });

  it("rejects impossible dates", () => {
    expect(() => NepaliDate.parse("32 Kartik 2083", "D MMMM YYYY")).toThrow(/day must be 1–30/);
    expect(() => NepaliDate.parse("2083-13-01", "YYYY-MM-DD")).toThrow(/month must be 1–12/);
  });

  it("rejects a pattern without a year, month and day", () => {
    for (const pattern of ["D MMMM", "MMMM YYYY", "YYYY-DD", "", "[YYYY-MM-DD]"]) {
      expect(() => NepaliDate.parse("2083-07-01", pattern), pattern).toThrow(
        /parse pattern needs a year/,
      );
    }
  });

  it("rejects text that isn't a string", () => {
    expect(() => NepaliDate.parse(20830701 as never, "YYYYMMDD")).toThrow(TypeError);
  });
});

describe("parse without a pattern", () => {
  it("still reads year-first dates", () => {
    expect(NepaliDate.parse("2083-6-26").toString()).toBe("2083-06-26");
  });

  it("works as a callback for Array#map, which passes extra arguments", () => {
    const dates = ["2083-06-26", "2083/07/01"].map(NepaliDate.parse);
    expect(dates.map(String)).toEqual(["2083-06-26", "2083-07-01"]);
  });
});

describe("format then parse", () => {
  const patterns = ["YYYY-MM-DD", "D MMMM YYYY", "dddd, D MMM YYYY", "DD/MM/YY ddd"];

  it("reads back what it writes for every day of 2083, in both locales and digit sets", () => {
    const first = YEAR_START[2083 - FIRST_YEAR];
    for (let days = first; days < YEAR_START[2083 - FIRST_YEAR + 1]; days++) {
      const date = NepaliDate.fromDays(days);
      for (const pattern of patterns) {
        for (const locale of ["en", "ne"] as const) {
          for (const digits of ["latin", "devanagari"] as const) {
            const text = date.format(pattern, { locale, digits });
            const back = NepaliDate.parse(text, pattern).toString();
            if (back !== date.toString()) {
              expect.fail(`${date} → ${JSON.stringify(text)} with ${pattern} → ${back}`);
            }
          }
        }
      }
    }
  });
});
