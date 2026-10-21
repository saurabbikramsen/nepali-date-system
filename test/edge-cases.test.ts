import { describe, expect, it } from "vitest";
import { MS_PER_DAY } from "../src/core/days.js";
import { FIRST_YEAR, LAST_YEAR } from "../src/defined.js";
import { NepaliDate } from "../src/nepali-date.js";

const bs = (text: string) => NepaliDate.parse(text);

describe("Asar 31 and Shrawan 1", () => {
  // Asar has 31 days in 2081, so Asar 31 is the last day of fiscal year 2080/81. In 2083 it has
  // 32, so Asar 31 is the second-to-last day of 2082/83.
  it.each([
    { year: 2081, asarDays: 31, before: "2080/81", after: "2081/82" },
    { year: 2083, asarDays: 32, before: "2082/83", after: "2083/84" },
  ])("split fiscal years in $year, when Asar has $asarDays days", (c) => {
    expect(NepaliDate.daysInMonth(c.year, 3)).toBe(c.asarDays);
    const asar31 = new NepaliDate(c.year, 3, 31);
    const lastAsar = new NepaliDate(c.year, 3, c.asarDays);
    const shrawan1 = new NepaliDate(c.year, 4, 1);

    expect(lastAsar.addDays(1)).toEqual(shrawan1);
    expect(shrawan1.diffInDays(asar31)).toBe(c.asarDays - 30);
    expect([asar31, lastAsar, shrawan1].map((d) => d.fiscalYear().label)).toEqual([
      c.before,
      c.before,
      c.after,
    ]);
    expect([asar31.fiscalQuarter(), shrawan1.fiscalQuarter()]).toEqual([4, 1]);
    expect([asar31.chaumasik(), shrawan1.chaumasik()]).toEqual([3, 1]);

    // The same BS year, but every fiscal period changes.
    expect(asar31.isSame(shrawan1, "year")).toBe(true);
    for (const unit of ["fiscalQuarter", "chaumasik", "fiscalYear"] as const) {
      expect(asar31.isSame(shrawan1, unit), unit).toBe(false);
      expect(asar31.endOf(unit), unit).toEqual(lastAsar);
      expect(shrawan1.startOf(unit), unit).toEqual(shrawan1);
      expect(asar31.range(unit).end, unit).toEqual(shrawan1.range(unit).start);
      expect(asar31.adRange(unit).end, unit).toBe(shrawan1.toAdString());
    }
  });

  it("put the last millisecond of Asar and the first of Shrawan in different fiscal years", () => {
    const { start, end } = bs("2081-03-31").range("fiscalYear", { as: "ms" });
    expect(new Date(start).toISOString()).toBe("2023-07-16T18:15:00.000Z");
    expect(new Date(end).toISOString()).toBe("2024-07-15T18:15:00.000Z");
    // 23:59:59.999 in Kathmandu on Asar 31 is inside the half-open range; midnight isn't.
    expect(NepaliDate.fromInstant(end - 1).toString()).toBe("2081-03-31");
    expect(NepaliDate.fromInstant(end).toString()).toBe("2081-04-01");
    expect(NepaliDate.fromInstant(end).range("fiscalYear", { as: "ms" }).start).toBe(end);
  });

  it("are in the same fiscal year when it starts in Baisakh", () => {
    const baisakh = { fiscalYearStartMonth: 1 };
    const asar31 = bs("2081-03-31");
    const shrawan1 = bs("2081-04-01");
    expect(asar31.fiscalYear(baisakh)).toEqual(shrawan1.fiscalYear(baisakh));
    expect(asar31.isSame(shrawan1, "fiscalYear", baisakh)).toBe(true);
    expect([asar31.fiscalQuarter(baisakh), shrawan1.fiscalQuarter(baisakh)]).toEqual([1, 2]);
    // Baisakh–Shrawan is the first four months, so this chaumasik doesn't change either.
    expect(asar31.isSame(shrawan1, "chaumasik", baisakh)).toBe(true);
  });

  it("split consecutive fiscal years at the end of every Asar in the table", () => {
    for (let year = FIRST_YEAR + 1; year <= LAST_YEAR; year++) {
      const shrawan1 = new NepaliDate(year, 4, 1);
      const lastAsar = shrawan1.addDays(-1);
      const before = lastAsar.fiscalYear();
      const after = shrawan1.fiscalYear();
      if (
        lastAsar.month !== 3 ||
        before.startYear !== year - 1 ||
        after.startYear !== year ||
        lastAsar.adRange("fiscalYear").end !== shrawan1.toAdString()
      ) {
        expect.fail(`${lastAsar} (${before.label}) to ${shrawan1} (${after.label})`);
      }
    }
  });
});

describe("birthdays on a 32nd day", () => {
  it("come on the 32nd when the month has one, and on its last day when it doesn't", () => {
    // Born on 2083-03-32. Asar 2084 has 32 days and Asar 2085 has 31.
    const born31 = bs("2083-03-31");
    const born32 = bs("2083-03-32");
    const age = (birth: NepaliDate, on: string) => NepaliDate.age(birth, bs(on));
    expect(age(born31, "2084-03-31")).toEqual({ years: 1, months: 0, days: 0 });
    // 11 months reach Jestha 31, as Jestha 2084 has no 32nd, and the birthday is Asar 32.
    expect(age(born32, "2084-03-31")).toEqual({ years: 0, months: 11, days: 31 });
    expect(age(born31, "2084-03-32")).toEqual({ years: 1, months: 0, days: 1 });
    expect(age(born32, "2084-03-32")).toEqual({ years: 1, months: 0, days: 0 });
    // In 2085 Asar has no 32nd, so both birthdays are on Asar 31.
    expect(age(born31, "2085-03-31")).toEqual({ years: 2, months: 0, days: 0 });
    expect(age(born32, "2085-03-31")).toEqual({ years: 2, months: 0, days: 0 });
  });

  it("come on the right day in every later year, for every 32nd day in the table", () => {
    let births = 0;
    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      for (let month = 1; month <= 12; month++) {
        if (NepaliDate.daysInMonth(year, month) !== 32) continue;
        births++;
        const birth = new NepaliDate(year, month, 32);
        for (let later = year + 1; later <= LAST_YEAR; later++) {
          // No month is longer than 32 days, so the birthday is always the month's last day.
          const birthday = new NepaliDate(later, month, NepaliDate.daysInMonth(later, month));
          const age = NepaliDate.age(birth, birthday);
          const before = NepaliDate.age(birth, birthday.addDays(-1));
          const years = later - year;
          if (
            age.years !== years ||
            age.months !== 0 ||
            age.days !== 0 ||
            birthday.diffInYears(birth) !== years ||
            before.years !== years - 1 ||
            before.months !== 11 ||
            birthday.addDays(-1).diffInYears(birth) !== years - 1
          ) {
            expect.fail(`born ${birth}: ${JSON.stringify(age)} on ${birthday}`);
          }
        }
      }
    }
    // Jestha, Asar and Shrawan often have 32 days, and Bhadra twice.
    expect(births).toBe(48 + 46 + 79 + 2);
  });

  it("reset the days to 0 on the last day of every month", () => {
    // Bhadra 2056 is one of the two Bhadras with 32 days.
    const birth = bs("2056-05-32");
    for (let on = birth; ; on = on.addDays(1)) {
      const { days } = NepaliDate.age(birth, on);
      if ((days === 0) !== (on.day === on.daysInMonth)) {
        expect.fail(`born ${birth}, on ${on}: ${days} days`);
      }
      if (on.isEqual(NepaliDate.MAX_DATE)) break;
    }
  });
});

describe("366-day years", () => {
  // BS 2081 has 366 days, with a 31-day Chaitra. 2082 and 2083 have 365.
  it("are one year long in every unit", () => {
    expect(NepaliDate.daysInYear(2081)).toBe(366);
    expect(bs("2081-12-31").dayOfYear).toBe(366);
    expect(bs("2082-01-01").diffInDays(bs("2081-01-01"))).toBe(366);
    expect(bs("2083-01-01").diffInDays(bs("2082-01-01"))).toBe(365);
    expect(bs("2082-01-01").diffInYears(bs("2081-01-01"))).toBe(1);
    expect(bs("2081-12-31").diffInYears(bs("2081-01-01"))).toBe(0);
    expect(NepaliDate.age(bs("2081-01-01"), bs("2081-12-31"))).toEqual({
      years: 0,
      months: 11,
      days: 30,
    });
    expect(NepaliDate.age(bs("2081-01-01"), bs("2082-01-01"))).toEqual({
      years: 1,
      months: 0,
      days: 0,
    });
  });

  it("give a 366-day range for the year", () => {
    const date = bs("2081-06-15");
    expect(date.adRange("year")).toEqual({ start: "2024-04-13", end: "2025-04-14" });
    const { start, end } = date.range("year", { as: "ms" });
    expect(end - start).toBe(366 * MS_PER_DAY);
    expect(date.endOf("year").toString()).toBe("2081-12-31");
  });

  it("put a birthday on the extra Chaitra 31 on Chaitra 30 in 365-day years", () => {
    const birth = bs("2081-12-31");
    for (const year of [2082, 2083, 2084, 2085]) {
      expect(NepaliDate.daysInMonth(year, 12), String(year)).toBe(30);
      expect(NepaliDate.age(birth, new NepaliDate(year, 12, 30)), String(year)).toEqual({
        years: year - 2081,
        months: 0,
        days: 0,
      });
      expect(NepaliDate.age(birth, new NepaliDate(year, 12, 29)).years, String(year)).toBe(
        year - 2082,
      );
    }
  });

  it("don't line up with 366-day fiscal years", () => {
    // Fiscal year 2081/82 has 366 days, and 2080/81, which ends in the 366-day BS year 2081,
    // has 365.
    expect(bs("2081-04-01").adRange("fiscalYear")).toEqual({
      start: "2024-07-16",
      end: "2025-07-17",
    });
    expect(bs("2082-04-01").diffInDays(bs("2081-04-01"))).toBe(366);
    expect(bs("2081-04-01").diffInDays(bs("2080-04-01"))).toBe(365);
    const { start, end } = bs("2081-04-01").range("fiscalYear", { as: "ms" });
    expect(end - start).toBe(366 * MS_PER_DAY);
  });

  it("have ranges as long as their days, for every year and fiscal year in the table", () => {
    const adDays = ({ start, end }: { start: string; end: string }) =>
      (Date.parse(end) - Date.parse(start)) / MS_PER_DAY;
    for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
      const baisakh1 = new NepaliDate(year, 1, 1);
      if (adDays(baisakh1.adRange("year")) !== NepaliDate.daysInYear(year)) {
        expect.fail(`BS ${year}`);
      }
      if (year < LAST_YEAR) {
        const shrawan1 = new NepaliDate(year, 4, 1);
        const days = new NepaliDate(year + 1, 4, 1).diffInDays(shrawan1);
        if (adDays(shrawan1.adRange("fiscalYear")) !== days || (days !== 365 && days !== 366)) {
          expect.fail(`fiscal year ${shrawan1.fiscalYear().label}: ${days} days`);
        }
      }
    }
  });
});
