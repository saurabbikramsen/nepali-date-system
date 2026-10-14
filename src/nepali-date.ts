import { adToDays, bsToDays, type DateParts, daysToAd, daysToBs } from "./core/days.js";

export class NepaliDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;

  private readonly days: number;

  constructor(year: number, month: number, day: number) {
    this.days = bsToDays(year, month, day);
    this.year = year;
    this.month = month;
    this.day = day;
    Object.freeze(this);
  }

  // -------------factories---------------
  static fromDays(days: number): NepaliDate {
    const { year, month, day } = daysToBs(days);
    return new NepaliDate(year, month, day);
  }

  static fromAd(year: number, month: number, day: number): NepaliDate {
    return NepaliDate.fromDays(adToDays(year, month, day));
  }

  // conversion
  toAd(): DateParts {
    return daysToAd(this.days);
  }
  toString(): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${this.year}-${p(this.month)}-${p(this.day)}`;
  }
  toJson(): string {
    return this.toString();
  }
}
