import { describe, expect, it } from "vitest";
import { NepaliDate } from "../src/nepali-date.js";

describe("NepaliDate construction", () => {
  it("accepts valid dates", () => {
    expect(new NepaliDate(2083, 6, 26).toString()).toBe("2083-06-26");
    expect(new NepaliDate(1975, 1, 1).toString()).toBe("1975-01-01"); // first day in table
    expect(new NepaliDate(2086, 12, 30).toString()).toBe("2086-12-30"); // last day in table
  });

  it.each([
    [1974, 1, 1], // before table
    [2087, 1, 1], // after table
    [2083, 0, 1], // month too low
    [2083, 13, 1], // month too high
    [2083, 1, 0], // day too low
    [2083, 6, 32], // Aswin 2083 has 31 days
    [2083, 6.5, 1], // not an integer
    [NaN, 1, 1],
  ])("rejects %i-%i-%i", (y, m, d) => {
    expect(() => new NepaliDate(y, m, d)).toThrow(RangeError);
  });

  it("is frozen", () => {
    const d = new NepaliDate(2083, 6, 26);
    expect(Object.isFrozen(d)).toBe(true);
    expect(() => {
      (d as { year: number }).year = 2000;
    }).toThrow(TypeError);
  });

  it("converts to AD", () => {
    const d = new NepaliDate(2083, 6, 26);
    expect(d.toAd()).toEqual({ year: 2026, month: 10, day: 12 });
  });

  it("converts from AD", () => {
    const d = NepaliDate.fromAd(2026, 10, 12);
    expect(d.toString()).toBe("2083-06-26");
  });
});
