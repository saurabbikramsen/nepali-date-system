import { describe, expect, it } from "vitest";
import { adToDays, bsToDays, EPOCH_AD_MS, MS_PER_DAY, TOTAL_DAYS } from "../src/core/days.js";
import { daysToStartInstant, instantToDays, nepalOffsetMs } from "../src/core/nepal-time.js";

const MINUTE_MS = 60_000;
const at = (iso: string) => Date.parse(iso);

/** The IANA time zone database through Intl: an independent reference the library doesn't use. */
const kathmandu = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kathmandu",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const intlDays = (utcMs: number) =>
  (Date.parse(kathmandu.format(utcMs)) - EPOCH_AD_MS) / MS_PER_DAY;

const TO_0530 = at("1919-12-31T18:18:44Z");
const TO_0545 = at("1985-12-31T18:30:00Z");

describe("Nepal's UTC offset", () => {
  it("is +05:41:16 local mean time before 1920", () => {
    expect(nepalOffsetMs(at("1918-04-13T00:00:00Z"))).toBe(((5 * 60 + 41) * 60 + 16) * 1000);
    expect(nepalOffsetMs(TO_0530 - 1)).toBe(((5 * 60 + 41) * 60 + 16) * 1000);
  });

  it("is +05:30 from 1920 to the end of 1985", () => {
    expect(nepalOffsetMs(TO_0530)).toBe(330 * MINUTE_MS);
    expect(nepalOffsetMs(at("1985-12-31T18:29:59Z"))).toBe(330 * MINUTE_MS);
  });

  it("is +05:45 from 1986-01-01", () => {
    expect(nepalOffsetMs(TO_0545)).toBe(345 * MINUTE_MS);
    expect(nepalOffsetMs(at("2026-10-18T18:15:00Z"))).toBe(345 * MINUTE_MS);
  });
});

describe("instantToDays", () => {
  it("changes date at 18:15 UTC", () => {
    expect(instantToDays(at("2026-10-17T18:14:59Z"))).toBe(bsToDays(2083, 6, 31));
    expect(instantToDays(at("2026-10-17T18:15:00Z"))).toBe(bsToDays(2083, 7, 1));
  });

  it("changes date at 18:30 UTC before 1986", () => {
    expect(instantToDays(at("1985-12-30T18:29:59Z"))).toBe(adToDays(1985, 12, 30));
    expect(instantToDays(at("1985-12-30T18:30:00Z"))).toBe(adToDays(1985, 12, 31));
  });

  it("uses a fixed offset when given one", () => {
    const utcMidnight = at("2026-10-19T00:00:00Z");
    expect(instantToDays(utcMidnight - 1, 0)).toBe(bsToDays(2083, 7, 1));
    expect(instantToDays(utcMidnight, 0)).toBe(bsToDays(2083, 7, 2));
  });

  it("matches Intl every second for an hour either side of each offset change", () => {
    for (const change of [TO_0530, TO_0545]) {
      for (let ms = change - 3_600_000; ms < change + 3_600_000; ms += 1000) {
        if (instantToDays(ms) !== intlDays(ms)) {
          expect.fail(
            `${new Date(ms).toISOString()}: ${instantToDays(ms)} vs Intl ${intlDays(ms)}`,
          );
        }
      }
    }
  });

  it("matches Intl across the whole table", () => {
    // A step that isn't a whole number of hours, so the samples drift through every time of day.
    const step = 7 * 3_600_000 + 13 * MINUTE_MS + 7_000;
    const end = EPOCH_AD_MS + TOTAL_DAYS * MS_PER_DAY;
    for (let ms = EPOCH_AD_MS; ms < end; ms += step) {
      if (instantToDays(ms) !== intlDays(ms)) {
        expect.fail(`${new Date(ms).toISOString()}: ${instantToDays(ms)} vs Intl ${intlDays(ms)}`);
      }
    }
  });
});

describe("daysToStartInstant", () => {
  it("starts a day at 18:15 UTC the day before", () => {
    expect(daysToStartInstant(bsToDays(2083, 7, 1))).toBe(at("2026-10-17T18:15:00Z"));
  });

  it("starts 1986-01-01 at the offset change, as 00:00–00:14 never existed", () => {
    expect(daysToStartInstant(adToDays(1986, 1, 1))).toBe(TO_0545);
  });

  it("starts 1920-01-01 at midnight +05:30", () => {
    expect(daysToStartInstant(adToDays(1920, 1, 1))).toBe(at("1919-12-31T18:30:00Z"));
  });

  it("is the first instant of every day in the table", () => {
    for (let days = 1; days < TOTAL_DAYS; days++) {
      const start = daysToStartInstant(days);
      if (
        instantToDays(start) !== days ||
        instantToDays(start - 1) !== days - 1 ||
        intlDays(start) !== days ||
        intlDays(start - 1) !== days - 1
      ) {
        expect.fail(`day ${days} starts at ${new Date(start).toISOString()}`);
      }
    }
  });
});
