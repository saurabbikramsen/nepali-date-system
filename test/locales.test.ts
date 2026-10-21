import { describe, expect, it } from "vitest";
import { MONTH_NAMES } from "../src/defined.js";
import { type Locale, LOCALES, resolveLocale } from "../src/locales.js";
import { NepaliDate } from "../src/nepali-date.js";

// Aswin 26, 2083 is Monday 12 October 2026.
const date = new NepaliDate(2083, 6, 26);

/** Nepali with the formal spellings some offices use. */
const formalNepali: Locale = {
  ...LOCALES.ne,
  months: ["वैशाख", "जेष्ठ", "आषाढ", "श्रावण", "भाद्र", "आश्विन"].concat([
    "कार्तिक",
    "मार्ग",
    "पौष",
    "माघ",
    "फाल्गुन",
    "चैत्र",
  ]),
  monthsShort: ["वैशाख", "जेष्ठ", "आषाढ", "श्रावण", "भाद्र", "आश्विन"].concat([
    "कार्तिक",
    "मार्ग",
    "पौष",
    "माघ",
    "फाल्गुन",
    "चैत्र",
  ]),
};

/** English with four-letter abbreviations that the built-in spellings don't include. */
const fourLetters: Locale = {
  ...LOCALES.en,
  monthsShort: ["Bais", "Jest", "Asar", "Shra", "Bhad", "Ashw"].concat([
    "Kart",
    "Mang",
    "Push",
    "Magh",
    "Fagu",
    "Chai",
  ]),
  weekdaysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
};

describe("custom locales in format", () => {
  it("prints a locale built from a built-in one", () => {
    expect(date.format("D MMMM YYYY", { locale: formalNepali })).toBe("२६ आश्विन २०८३");
    expect(date.format("D MMM, ddd", { locale: fourLetters })).toBe("26 Ashw, Mo");
  });

  it("uses the locale's digits unless digits is given", () => {
    expect(date.format("D MMMM", { locale: formalNepali, digits: "latin" })).toBe("26 आश्विन");
    expect(date.format("D MMMM", { locale: { ...fourLetters, digits: "devanagari" } })).toBe(
      "२६ Aswin",
    );
  });

  it("doesn't change the locale object", () => {
    const copy = structuredClone(fourLetters);
    date.format("dddd D MMMM YYYY", { locale: fourLetters });
    expect(fourLetters).toEqual(copy);
  });
});

describe("custom locales in parse", () => {
  it("reads names only a custom locale has", () => {
    expect(() => NepaliDate.parse("26 Ashw 2083", "D MMM YYYY")).toThrow(/doesn't match/);
    expect(NepaliDate.parse("26 Ashw 2083", "D MMM YYYY", { locale: fourLetters }).toString()).toBe(
      "2083-06-26",
    );
    expect(
      NepaliDate.parse("Mo 26 Ashw 2083", "ddd D MMM YYYY", { locale: fourLetters }).toString(),
    ).toBe("2083-06-26");
  });

  it("still reads the built-in names with a custom locale", () => {
    expect(
      NepaliDate.parse("26 Asoj 2083", "D MMMM YYYY", { locale: fourLetters }).toString(),
    ).toBe("2083-06-26");
  });

  it("gives a custom locale's names priority over built-in spellings", () => {
    // A made-up locale that calls month 1 "Asoj", which the built-in names read as month 6.
    const odd: Locale = { ...LOCALES.en, months: ["Asoj", ...MONTH_NAMES.slice(1)] };
    expect(NepaliDate.parse("1 Asoj 2083", "D MMMM YYYY").month).toBe(6);
    expect(NepaliDate.parse("1 Asoj 2083", "D MMMM YYYY", { locale: odd }).month).toBe(1);
  });

  it("accepts the built-in names as a locale", () => {
    expect(NepaliDate.parse("26 Asoj 2083", "D MMMM YYYY", { locale: "ne" }).toString()).toBe(
      "2083-06-26",
    );
  });

  it("reads back everything it writes for every day of 2083", () => {
    for (const locale of [formalNepali, fourLetters]) {
      for (let day = NepaliDate.parse("2083-01-01"); ;) {
        for (const pattern of ["dddd, D MMMM YYYY", "ddd D MMM YY"]) {
          const text = day.format(pattern, { locale });
          const back = NepaliDate.parse(text, pattern, { locale }).toString();
          if (back !== day.toString()) expect.fail(`${day} → ${text} → ${back}`);
        }
        if (day.toString() === "2083-12-30") break;
        day = NepaliDate.fromInstant(day.range("day", { offsetMinutes: 0 }).end, {
          offsetMinutes: 0,
        });
      }
    }
  });
});

describe("locale checks", () => {
  const bad = (change: Partial<Record<keyof Locale, unknown>>) =>
    ({ ...LOCALES.en, ...change }) as Locale;

  it.each([
    ["11 months", bad({ months: MONTH_NAMES.slice(0, 11) }), /locale\.months must be 12/],
    ["an empty name", bad({ weekdays: ["", "M", "T", "W", "T2", "F", "S"] }), /weekdays must be 7/],
    [
      "a blank name",
      bad({ monthsShort: [" ", ...MONTH_NAMES.slice(1)] }),
      /monthsShort must be 12/,
    ],
    ["a number", bad({ weekdaysShort: [1, 2, 3, 4, 5, 6, 7] }), /weekdaysShort must be 7/],
    ["no list", bad({ months: undefined }), /locale\.months must be 12/],
    ["bad digits", bad({ digits: "roman" }), /locale\.digits must be "latin" or "devanagari"/],
    [
      "a month name used twice",
      bad({ months: ["Baisakh", "baisakh", ...MONTH_NAMES.slice(2)] }),
      /uses "baisakh" for two different months/,
    ],
    [
      "a short name equal to another month",
      bad({ monthsShort: ["Jestha", ...MONTH_NAMES.slice(1)] }),
      /uses "Jestha" for two different months/,
    ],
    [
      "a weekday used twice",
      bad({ weekdaysShort: ["S", "M", "T", "W", "T", "F", "S"] }),
      /for two different weekdays/,
    ],
  ])("rejects %s", (_, locale, message) => {
    expect(() => date.format("MMMM", { locale })).toThrow(message);
    expect(() => NepaliDate.parse("2083-06-26", "YYYY-MM-DD", { locale })).toThrow(message);
  });

  it("rejects things that aren't locales", () => {
    for (const locale of [42, "fr", "__proto__", true]) {
      expect(() => date.format("MMMM", { locale: locale as never }), String(locale)).toThrow(
        /locale must be "en", "ne" or a Locale object/,
      );
    }
  });

  it("treats a null locale like a missing one", () => {
    expect(date.format("MMMM", { locale: null as never })).toBe("Aswin");
  });

  it("accepts the built-in locales", () => {
    expect(resolveLocale(LOCALES.en)).toBe(LOCALES.en);
    expect(resolveLocale(LOCALES.ne)).toBe(LOCALES.ne);
  });

  it("allows the same name for a month's full and short forms", () => {
    expect(resolveLocale(formalNepali)).toBe(formalNepali);
  });
});

describe("built-in locales", () => {
  it("can't be changed by code using the library", () => {
    expect(() => {
      (LOCALES.en.months as string[])[0] = "Changed";
    }).toThrow(TypeError);
    expect(() => {
      (LOCALES as Record<string, Locale>).fr = LOCALES.en;
    }).toThrow(TypeError);
    expect(() => {
      (MONTH_NAMES as unknown as string[])[0] = "Changed";
    }).toThrow(TypeError);
    expect(date.format("MMMM")).toBe("Aswin");
  });
});
