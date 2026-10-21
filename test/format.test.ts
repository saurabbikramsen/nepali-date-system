import { describe, expect, it } from "vitest";
import { TOTAL_DAYS } from "../src/core/days.js";
import { MONTH_NAMES } from "../src/defined.js";
import { NepaliDate } from "../src/nepali-date.js";

// Kartik 1, 2083 is Sunday 18 October 2026.
const kartik1 = new NepaliDate(2083, 7, 1);

describe("format tokens", () => {
  it.each([
    ["YYYY", "2083"],
    ["YY", "83"],
    ["MMMM", "Kartik"],
    ["MMM", "Kar"],
    ["MM", "07"],
    ["M", "7"],
    ["DD", "01"],
    ["D", "1"],
    ["dddd", "Sunday"],
    ["ddd", "Sun"],
    ["d", "0"],
  ])("%s gives %s", (pattern, expected) => {
    expect(kartik1.format(pattern)).toBe(expected);
  });

  it("pads two-digit years, months and days", () => {
    expect(new NepaliDate(2005, 12, 9).format("YY MM DD")).toBe("05 12 09");
    expect(new NepaliDate(2000, 1, 1).format("YY")).toBe("00");
    expect(new NepaliDate(2083, 3, 32).format("D DD")).toBe("32 32");
  });

  it("names every month and weekday", () => {
    for (let month = 1; month <= 12; month++) {
      const date = new NepaliDate(2083, month, 1);
      expect(date.format("MMMM")).toBe(MONTH_NAMES[month - 1]);
      expect(date.format("MMM")).toBe(MONTH_NAMES[month - 1].slice(0, 3));
    }
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let offset = 0; offset < 7; offset++) {
      const date = new NepaliDate(2083, 7, 1 + offset);
      expect(date.format("dddd ddd d")).toBe(
        `${weekdays[offset]} ${weekdays[offset].slice(0, 3)} ${offset}`,
      );
    }
  });

  it("gives every month a distinct short name", () => {
    const short = new Set(MONTH_NAMES.map((_, i) => new NepaliDate(2083, i + 1, 1).format("MMM")));
    expect(short.size).toBe(12);
  });
});

describe("format patterns", () => {
  it("combines tokens with separators", () => {
    expect(kartik1.format("D MMMM YYYY")).toBe("1 Kartik 2083");
    expect(kartik1.format("dddd, D MMMM YYYY")).toBe("Sunday, 1 Kartik 2083");
    expect(kartik1.format("YYYY/MM/DD")).toBe("2083/07/01");
    expect(kartik1.format("ddd DD.MM.YY")).toBe("Sun 01.07.83");
  });

  it("matches toString with YYYY-MM-DD for every day in the table", () => {
    for (let days = 0; days < TOTAL_DAYS; days++) {
      const date = NepaliDate.fromDays(days);
      if (date.format("YYYY-MM-DD") !== date.toString()) {
        expect.fail(`${date.toString()} formatted as ${date.format("YYYY-MM-DD")}`);
      }
    }
  });

  it("prints text in square brackets as it is", () => {
    expect(kartik1.format("[Today is] dddd")).toBe("Today is Sunday");
    expect(kartik1.format("[YYYY-MM-DD] YYYY")).toBe("YYYY-MM-DD 2083");
    expect(kartik1.format("[]D")).toBe("1");
  });

  it("replaces token letters inside unbracketed words", () => {
    expect(kartik1.format("Today")).toBe("To0ay");
  });

  it("reads the longest token first", () => {
    expect(kartik1.format("MMMMM")).toBe("Kartik7");
    expect(kartik1.format("YYY")).toBe("83Y");
  });

  it("copies an unclosed bracket and other characters as they are", () => {
    expect(kartik1.format("[YYYY")).toBe("[2083");
    expect(kartik1.format("")).toBe("");
    expect(kartik1.format("— x —")).toBe("— x —");
  });

  it("rejects a pattern that isn't a string", () => {
    expect(() => kartik1.format(undefined as never)).toThrow(TypeError);
    expect(() => kartik1.format(42 as never)).toThrow(TypeError);
  });
});

describe("format locales", () => {
  const ne = { locale: "ne" } as const;

  it.each([
    ["MMMM", "कार्तिक"],
    ["MMM", "कार्तिक"],
    ["dddd", "आइतबार"],
    ["ddd", "आइत"],
  ])("ne %s gives %s", (pattern, expected) => {
    expect(kartik1.format(pattern, ne)).toBe(expected);
  });

  it("names every month and weekday in Nepali", () => {
    const months = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज"];
    const moreMonths = ["कार्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"];
    [...months, ...moreMonths].forEach((name, i) => {
      expect(new NepaliDate(2083, i + 1, 1).format("MMMM", ne)).toBe(name);
    });
    const weekdays = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
    weekdays.forEach((name, offset) => {
      expect(new NepaliDate(2083, 7, 1 + offset).format("dddd ddd", ne)).toBe(
        `${name} ${name.replace("बार", "")}`,
      );
    });
  });

  it("uses Devanagari digits by default", () => {
    expect(kartik1.format("D MMMM YYYY, dddd", ne)).toBe("१ कार्तिक २०८३, आइतबार");
    expect(kartik1.format("YYYY-MM-DD", ne)).toBe("२०८३-०७-०१");
  });

  it("prints Nepali text in square brackets", () => {
    expect(kartik1.format("[आज] dddd", ne)).toBe("आज आइतबार");
  });

  it("uses English by default", () => {
    expect(kartik1.format("dddd D MMMM")).toBe("Sunday 1 Kartik");
    expect(kartik1.format("dddd D MMMM", { locale: "en" })).toBe("Sunday 1 Kartik");
    expect(kartik1.format("dddd D MMMM", {})).toBe("Sunday 1 Kartik");
  });

  it("rejects unknown locales", () => {
    for (const locale of ["np", "hi", "toString", "__proto__"]) {
      expect(() => kartik1.format("MMMM", { locale: locale as never }), locale).toThrow(
        /locale must be "en", "ne" or a Locale object/,
      );
    }
  });
});

describe("format digits", () => {
  const devanagari = { digits: "devanagari" } as const;

  it.each([
    ["YYYY", "२०८३"],
    ["YY", "८३"],
    ["MM", "०७"],
    ["M", "७"],
    ["DD", "०१"],
    ["D", "१"],
    ["d", "०"],
  ])("devanagari %s gives %s", (pattern, expected) => {
    expect(kartik1.format(pattern, devanagari)).toBe(expected);
  });

  it("writes every digit", () => {
    expect(new NepaliDate(2083, 12, 30).format("YYYY-MM-DD", devanagari)).toBe("२०८३-१२-३०");
    expect(new NepaliDate(1975, 4, 5).format("YYYY M D", devanagari)).toBe("१९७५ ४ ५");
    expect(new NepaliDate(2068, 9, 7).format("YYYY M D", devanagari)).toBe("२०६८ ९ ७");
  });

  it("chooses digits separately from the locale", () => {
    expect(kartik1.format("D MMMM YYYY", devanagari)).toBe("१ Kartik २०८३");
    expect(kartik1.format("D MMMM YYYY", { locale: "ne", digits: "latin" })).toBe("1 कार्तिक 2083");
    expect(kartik1.format("D MMMM YYYY", { digits: "latin" })).toBe("1 Kartik 2083");
  });

  it("leaves digits in square brackets as they are", () => {
    expect(kartik1.format("[2083] YYYY", devanagari)).toBe("2083 २०८३");
    expect(kartik1.format("[२०८३] YYYY", { digits: "latin" })).toBe("२०८३ 2083");
  });

  it("parses back what it formats, for every day in the table", () => {
    for (let days = 0; days < TOTAL_DAYS; days++) {
      const date = NepaliDate.fromDays(days);
      const text = date.format("YYYY-MM-DD", devanagari);
      if (NepaliDate.parse(text).toString() !== date.toString()) {
        expect.fail(`${date.toString()} → ${text} → ${NepaliDate.parse(text).toString()}`);
      }
    }
  });

  it("rejects unknown digit systems", () => {
    expect(() => kartik1.format("YYYY", { digits: "arabic" as never })).toThrow(
      /digits must be "latin" or "devanagari", got "arabic"/,
    );
  });
});

describe("Devanagari digits as input", () => {
  it("parses BS dates with any separator and padding", () => {
    expect(NepaliDate.parse("२०८३-०६-२६").toString()).toBe("2083-06-26");
    expect(NepaliDate.parse("२०८३/६/२६").toString()).toBe("2083-06-26");
    expect(NepaliDate.parse("२०८३.०६.२६").toString()).toBe("2083-06-26");
  });

  it("accepts a mix of Devanagari and 0–9 digits", () => {
    expect(NepaliDate.parse("२०८३-06-26").toString()).toBe("2083-06-26");
  });

  it("converts AD dates written in Devanagari", () => {
    expect(NepaliDate.fromAd("२०२६-१०-१२").toString()).toBe("2083-06-26");
  });

  it("quotes the original text when a date is impossible or badly formed", () => {
    expect(() => NepaliDate.parse("२०८३-०६-३२")).toThrow(RangeError);
    expect(() => NepaliDate.parse("२६/०६/२०८३")).toThrow(/got "२६\/०६\/२०८३"/);
  });

  it("points a Devanagari date given to fromInstant to fromAd", () => {
    expect(() => NepaliDate.fromInstant("२०२६-१०-१८")).toThrow(/NepaliDate\.fromAd/);
  });
});
