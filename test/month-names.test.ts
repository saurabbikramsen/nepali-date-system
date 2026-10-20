import { describe, expect, it } from "vitest";
import { monthFromName } from "../src/month-names.js";
import { NepaliDate } from "../src/nepali-date.js";

describe("monthFromName", () => {
  it.each([
    // The spellings named in the roadmap
    ["Asar", 3],
    ["Ashadh", 3],
    ["Asadh", 3],
    ["Aswin", 6],
    ["Ashwin", 6],
    ["Asoj", 6],
    ["Poush", 9],
    ["Push", 9],
    ["Paush", 9],
    ["Mangsir", 8],
    ["Mansir", 8],
    ["Shrawan", 4],
    ["Saun", 4],
    // A few more common ones
    ["Baishakh", 1],
    ["Jeth", 2],
    ["Bhadau", 5],
    ["Phalgun", 11],
    ["Fagun", 11],
    ["Chait", 12],
    // Formal Devanagari spellings
    ["वैशाख", 1],
    ["श्रावण", 4],
    ["आश्विन", 6],
    ["पौष", 9],
    ["चैत्र", 12],
  ])("reads %j as month %i", (name, month) => {
    expect(monthFromName(name)).toBe(month);
  });

  it("reads back every name format prints, in both locales", () => {
    for (let month = 1; month <= 12; month++) {
      const date = new NepaliDate(2083, month, 1);
      for (const locale of ["en", "ne"] as const) {
        for (const pattern of ["MMMM", "MMM"]) {
          const name = date.format(pattern, { locale });
          expect(monthFromName(name), `${locale} ${pattern} ${name}`).toBe(month);
        }
      }
    }
  });

  it("ignores case and surrounding spaces", () => {
    expect(monthFromName("ASOJ")).toBe(6);
    expect(monthFromName("ashwin")).toBe(6);
    expect(monthFromName("  Kartik ")).toBe(7);
  });

  it("returns undefined for anything that isn't a month", () => {
    for (const name of ["", "Asojj", "Jan", "October", "13", "toString", "__proto__"]) {
      expect(monthFromName(name), name).toBeUndefined();
    }
  });
});
