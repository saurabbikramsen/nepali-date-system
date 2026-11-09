# nepali-date-system

[![npm](https://img.shields.io/npm/v/nepali-date-system)](https://www.npmjs.com/package/nepali-date-system)
[![CI](https://github.com/saurabbikramsen/nepali-date-system/actions/workflows/ci.yml/badge.svg)](https://github.com/saurabbikramsen/nepali-date-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/nepali-date-system)](LICENSE)

Nepali dates (Bikram Sambat, or BS) for JavaScript and TypeScript. Converts between BS and AD using a month-length table checked against published panchangs and dated historical documents.

It also gives you today's date in Nepal on a server in any time zone, and the exact start and end of Nepali days, months and years, and of fiscal years, quarters and chaumasik periods, for database queries. It adds and compares dates, and formats and parses them in English or Nepali, with 0–9 or Devanagari digits.

## Why this library

- **The right date on any server.** `NepaliDate.today()` and `NepaliDate.fromInstant()` give the date in Kathmandu whether your server runs in UTC, the US or Nepal. Libraries that read the server's local time are wrong for part of every day on servers outside Nepal: on a UTC server, from 18:15 to midnight.
- **Ready for database queries.** `range()` gives the exact start and end of any Nepali day, week, month or year, or fiscal year, quarter or chaumasik, so `>= start AND < end` never drops or double-counts a row.
- **Checked month data.** Month lengths for BS 1975–2086 are cross-checked across open-source tables and published panchangs, and the years where tables disagree are settled from documents written at the time. The tests check 116 dated historical events and every day in the table.
- **Safe to pass around.** Dates are immutable, every method returns a new one, and there are no runtime dependencies.

How it compares with [nepali-date-converter](https://www.npmjs.com/package/nepali-date-converter) 3.4.0, a widely used alternative:

|                                              | nepali-date-system | nepali-date-converter 3.4.0                |
| -------------------------------------------- | ------------------ | ------------------------------------------ |
| BS years                                     | 1975–2086          | 2000–2090                                  |
| Date in Nepal on a UTC or US server          | Yes                | No: uses the server's local time           |
| Day, week, month and year ranges for queries | Yes                | No                                         |
| Add days, weeks, months and years            | Yes, with clamping | No                                         |
| Fiscal years, quarters and chaumasik periods | Yes                | No                                         |
| Date differences and age                     | Yes                | No                                         |
| Dates can't be changed by accident           | Yes, immutable     | No: `setDate`, `setMonth` and `setYear` do |
| Nepali names and Devanagari digits           | Yes                | Yes                                        |
| TypeScript types                             | Yes                | Yes                                        |

## Install

```sh
npm install nepali-date-system
```

No runtime dependencies. Ships ESM and CommonJS builds with TypeScript types. Works on Node.js 18 and later, Deno, Bun, current browsers through any bundler, and React Native. CI tests every change on Node.js 18, 20, 22 and 24, Deno, Bun, a Vite app in Chromium, Firefox and WebKit, and React Native's Metro bundler and Hermes engine.

## Quick start

```ts
import { NepaliDate, MONTH_NAMES } from "nepali-date-system";

// BS → AD
const date = new NepaliDate(2083, 6, 26); // Aswin 26, 2083
date.toAdString(); // "2026-10-12"
date.toAd(); // { year: 2026, month: 10, day: 12 }

// AD → BS
NepaliDate.fromAd(2026, 10, 12).toString(); // "2083-06-26"
NepaliDate.fromAd("2026-10-12").toString(); // "2083-06-26"

// Read a BS date string
NepaliDate.parse("2083-06-26"); // also accepts "2083/06/26", "2083.6.26" and "2083 06 26"
```

With CommonJS:

```js
const { NepaliDate } = require("nepali-date-system");
```

### Reading a date

Months are 1-based: 1 is Baisakh and 12 is Chaitra.

```ts
date.year; // 2083
date.month; // 6
date.day; // 26
MONTH_NAMES[date.month - 1]; // "Aswin"
date.dayOfWeek; // 1 (0 = Sunday … 6 = Saturday)
date.dayOfYear; // 182
date.daysInMonth; // 31
date.daysInYear; // 365
```

Nepal's fiscal year runs from Shrawan 1 to the last day of Asar, so Baisakh to Asar belong to the fiscal year that began the year before. Its quarters are Shrawan–Aswin (1), Kartik–Poush (2), Magh–Chaitra (3) and Baisakh–Asar (4). The government also reports in chaumasik, four-month periods: Shrawan–Kartik (1), Mangsir–Falgun (2) and Chaitra–Asar (3):

```ts
date.fiscalYear(); // { startYear: 2083, endYear: 2084, label: "2083/84" }
date.fiscalQuarter(); // 1
date.chaumasik(); // 1
`Q${date.fiscalQuarter()} ${date.fiscalYear().label}`; // "Q1 2083/84"

const asar = new NepaliDate(2084, 3, 15);
asar.fiscalYear().label; // "2083/84"
asar.fiscalQuarter(); // 4
asar.chaumasik(); // 3
```

If your organization's fiscal year starts in another month, pass `fiscalYearStartMonth` (1 = Baisakh to 12 = Chaitra). Quarters and chaumasiks are then counted from that month. A fiscal year that starts in Baisakh is the BS year:

```ts
const baisakh = { fiscalYearStartMonth: 1 };
date.fiscalYear(baisakh); // { startYear: 2083, endYear: 2083, label: "2083" }
date.fiscalQuarter(baisakh); // 2 (Shrawan–Aswin)
```

To query a whole fiscal year, quarter or chaumasik, see [Fiscal periods](#fiscal-periods).

### Storing and sending dates

`NepaliDate` instances are immutable. They serialize to `YYYY-MM-DD` strings, and `NepaliDate.parse` reads them back.

```ts
const json = JSON.stringify({ due: date }); // '{"due":"2083-06-26"}'
const due = NepaliDate.parse(JSON.parse(json).due);
```

### Invalid dates

The constructor, `fromAd` and `parse` throw a `RangeError` for a date that doesn't exist or is outside the [supported range](#supported-range). Use `isValid` to check without throwing.

```ts
new NepaliDate(2083, 2, 32); // RangeError: day must be 1–31 for BS 2083-2, got 32
NepaliDate.isValid(2083, 2, 32); // false
NepaliDate.isValid(2083, 3, 32); // true: Asar 2083 has 32 days
NepaliDate.daysInMonth(2083, 3); // 32
NepaliDate.daysInYear(2083); // 365
```

Without a pattern, `parse` and `fromAd` only accept year-first strings. `"26/06/2083"` throws, because day-first and month-first dates can't be told apart. To read another layout, give `parse` a [pattern](#parsing).

## Date arithmetic and comparison

Every method returns a new date; a `NepaliDate` never changes.

```ts
const date = NepaliDate.parse("2083-07-15");

date.addDays(10); // 2083-07-25
date.addWeeks(-1); // 2083-07-08
date.addMonths(1); // 2083-08-15
date.addYears(1); // 2084-07-15
date.startOf("month"); // 2083-07-01, also "week", "fiscalQuarter", "chaumasik", "year" and "fiscalYear"
date.endOf("month"); // 2083-07-30
```

Negative amounts go back in time. Amounts must be whole numbers, and a result outside the [supported range](#supported-range) throws a `RangeError`.

To compare dates, use these methods rather than `<` or `===`, which compare objects:

```ts
a.isBefore(b);
a.isAfter(b);
a.isEqual(b);
a.isSame(b, "month"); // also "day", "week", "fiscalQuarter", "chaumasik", "year" and "fiscalYear"
date.isBetween(from, to); // both ends included

dates.sort(NepaliDate.compare); // oldest first
NepaliDate.min(dates); // also NepaliDate.min(a, b, c)
NepaliDate.max(dates);
```

To measure the gap between two dates, `a.diffInDays(b)`, `a.diffInMonths(b)` and `a.diffInYears(b)` count from `b` to `a`, like `a - b`. They're negative if `a` is earlier:

```ts
const from = NepaliDate.parse("2083-01-15");
const to = NepaliDate.parse("2084-03-14");

to.diffInDays(from); // 426
to.diffInMonths(from); // 13: one more month would be 2084-03-15, after `to`
to.diffInYears(from); // 1
from.diffInMonths(to); // -13
```

Months and years count only full units, the same way `addMonths` and `addYears` add them: `b.addMonths(a.diffInMonths(b))` is never after `a`. That includes [ending on a shorter month's last day](#adding-months-and-years), so `2056-06-30` is 1 month after `2056-05-32`. Swapping the dates only flips the sign.

For someone's age in years, months and days, use `NepaliDate.age`. It's counted on today's date in Nepal unless you give another date:

```ts
const birthDate = NepaliDate.parse("2056-05-15");

NepaliDate.age(birthDate, NepaliDate.parse("2083-06-26")); // { years: 27, months: 1, days: 11 }
NepaliDate.age(birthDate); // on today's date in Nepal
```

The years and months are counted like `diffInYears` and `diffInMonths`, so a birthday on a day the month lacks comes on its last day: someone born on `2081-12-31` turns 1 on `2082-12-30`, the last day of Chaitra 2082. A birth date after the other date throws a `RangeError`.

For reports, `NepaliDate.eachDay(from, to)` lists every date and `NepaliDate.eachMonth(from, to)` lists the first day of every month, both ends included:

```ts
NepaliDate.eachMonth(from, to).map((month) => ({
  label: month.format("MMMM YYYY"), // "Baisakh 2083"
  ...month.adRange("month"), // { start: "2026-04-14", end: "2026-05-15" }
}));
```

### Adding months and years

`addMonths` and `addYears` keep the day of the month. BS months are 29 to 32 days long and change from year to year, so when the new month is shorter, you get its last day instead. You never spill over into the following month:

| Date         | Operation                     | Result       | Why                                                |
| ------------ | ----------------------------- | ------------ | -------------------------------------------------- |
| `2083-07-15` | `.addMonths(1)`               | `2083-08-15` | Day 15 exists in every month                       |
| `2056-05-32` | `.addMonths(1)`               | `2056-06-30` | Bhadra 2056 has 32 days, Aswin 2056 has 30         |
| `2083-07-30` | `.addMonths(1)`               | `2083-08-29` | Mangsir 2083 has 29 days                           |
| `2083-03-32` | `.addMonths(-1)`              | `2083-02-31` | Jestha 2083 has 31 days                            |
| `2083-12-30` | `.addMonths(1)`               | `2084-01-30` | Chaitra rolls over into Baisakh of the next year   |
| `2057-12-31` | `.addMonths(1)`               | `2058-01-30` | Baisakh 2058 has 30 days                           |
| `2084-01-31` | `.addMonths(-1)`              | `2083-12-30` | Back over the year end: Chaitra 2083 has 30 days   |
| `2083-01-31` | `.addMonths(-13)`             | `2081-12-31` | Chaitra 2081 has 31 days, so nothing changes       |
| `2081-12-31` | `.addYears(1)`                | `2082-12-30` | Chaitra 2082 has 30 days                           |
| `2082-03-32` | `.addYears(-1)`               | `2081-03-31` | Asar 2081 has 31 days                              |
| `2056-05-32` | `.addMonths(1).addMonths(-1)` | `2056-05-30` | The 32nd was lost in Aswin, so this doesn't undo   |
| `2029-03-32` | `.addMonths(2)`               | `2029-05-32` | Bhadra 2029 has 32 days                            |
| `2029-03-32` | `.addMonths(1).addMonths(1)`  | `2029-05-31` | One month at a time loses the 32nd in Shrawan (31) |

So adding and then subtracting months doesn't always return the starting date, and `addMonths(2)` can differ from `addMonths(1).addMonths(1)`. Add the whole amount in one call. Days 1 to 29 exist in every month, so they never change.

## Formatting

`format` prints a date with a pattern of tokens:

```ts
const date = new NepaliDate(2083, 7, 1); // Kartik 1, 2083, a Sunday

date.format("dddd, D MMMM YYYY"); // "Sunday, 1 Kartik 2083"
date.format("dddd, D MMMM YYYY", { locale: "ne" }); // "आइतबार, १ कार्तिक २०८३"
date.format("D MMMM YYYY", { locale: "ne", digits: "latin" }); // "1 कार्तिक 2083"
date.format("YYYY-MM-DD", { digits: "devanagari" }); // "२०८३-०७-०१"
```

| Token    | Meaning                    | English (`"en"`) | Nepali (`"ne"`) |
| -------- | -------------------------- | ---------------- | --------------- |
| `YYYY`   | Year                       | 2083             | २०८३            |
| `YY`     | Year, last two digits      | 83               | ८३              |
| `MMMM`   | Month name                 | Kartik           | कार्तिक         |
| `MMM`    | Short month name           | Kar              | कार्तिक         |
| `MM`     | Month, two digits          | 07               | ०७              |
| `M`      | Month                      | 7                | ७               |
| `DD`     | Day, two digits            | 01               | ०१              |
| `D`      | Day                        | 1                | १               |
| `dddd`   | Weekday name               | Sunday           | आइतबार          |
| `ddd`    | Short weekday name         | Sun              | आइत             |
| `d`      | Weekday number, 0 = Sunday | 0                | ०               |
| `[text]` | The text inside, unchanged | text             | text            |

Examples are for Kartik 1, 2083. Months are Baisakh (बैशाख) to Chaitra (चैत), and weekdays Sunday (आइतबार) to Saturday (शनिबार). Nepali month names aren't usually abbreviated, so `MMM` prints them in full.

- **`locale`** picks the names: `"en"` (the default) or `"ne"`.
- **`digits`** picks the digits: `"latin"` or `"devanagari"`. It defaults to the locale's own: Latin for English, Devanagari for Nepali.
- **Anything that isn't a token is copied as it is**, including `-`, `/`, `,` and spaces. Token letters are replaced even inside words, so put words in square brackets: `format("[Today is] dddd")` gives `"Today is Sunday"`, but `format("Today")` gives `"To0ay"`.

### Parsing

Give `parse` the same pattern to read a date back:

```ts
NepaliDate.parse("26 Asoj 2083", "D MMMM YYYY"); // 2083-06-26
NepaliDate.parse("२६ असोज २०८३", "D MMMM YYYY"); // 2083-06-26
NepaliDate.parse("26/06/2083", "DD/MM/YYYY"); // 2083-06-26
NepaliDate.parse("2083.06.26", "YYYY-MM-DD"); // 2083-06-26: -, / and . are interchangeable
```

- **Month names can be in any common spelling**, English or Nepali, in any case: Asar, Ashadh and Asadh; Aswin, Ashwin and Asoj; Poush, Push and Paush; Mangsir and Mansir; Shrawan and Saun; and formal Nepali spellings such as वैशाख, श्रावण and पौष. Weekday names can be in either language too.
- **Digits** can be 0–9 or Devanagari.
- **`YY`** is read as 20YY. Years before 2000 need `YYYY`.

Parsing is strict by default. The whole text must match the pattern, `MM` and `DD` need two digits, the separators must all be the same, and a weekday in the text must be the date's real weekday. Pass `{ strict: false }` to accept one-digit `MM` and `DD`, mixed separators and extra spaces, and to skip the weekday check:

```ts
NepaliDate.parse("2083-6-26", "YYYY-MM-DD"); // RangeError: doesn't match
NepaliDate.parse("2083-6-26", "YYYY-MM-DD", { strict: false }); // 2083-06-26
NepaliDate.parse("Monday, 1 Kartik 2083", "dddd, D MMMM YYYY"); // RangeError: 2083-07-01 is a Sunday
```

### Custom spellings

To print other spellings or another language, pass your own locale instead of `"en"` or `"ne"`. Start from a built-in one in `LOCALES` and change what you need:

```ts
import { NepaliDate, LOCALES } from "nepali-date-system";

const formalNepali = {
  ...LOCALES.ne,
  months: [
    "वैशाख",
    "जेष्ठ",
    "आषाढ",
    "श्रावण",
    "भाद्र",
    "आश्विन",
    "कार्तिक",
    "मार्ग",
    "पौष",
    "माघ",
    "फाल्गुन",
    "चैत्र",
  ],
};

new NepaliDate(2083, 4, 15).format("D MMMM YYYY", { locale: formalNepali }); // "१५ श्रावण २०८३"
```

A locale needs 12 month names and 7 weekday names, in full and short forms, and its `digits`. No name can stand for two different months or weekdays. Pass the same locale to `parse` (`{ locale: formalNepali }`) to read names that only it uses.

## Nepal time

A server's clock is usually set to UTC or a US time zone, where the Nepali date changes at 18:15 UTC, not at local midnight. These methods always use the date in Nepal, whatever the server's time zone:

```ts
NepaliDate.today(); // today's date in Nepal
NepaliDate.fromInstant(new Date()); // the date in Nepal at any moment
NepaliDate.fromInstant(payment.createdAt); // e.g. a timestamp from your database
NepaliDate.fromInstant(1792260900000); // epoch milliseconds
NepaliDate.fromInstant("2026-10-17T18:15:00Z").toString(); // "2083-07-01"
NepaliDate.fromInstant("2026-10-18T00:00:00+05:45").toString(); // "2083-07-01", the same moment

new NepaliDate(2083, 7, 1).startInstant(); // Date 2026-10-17T18:15:00.000Z, midnight in Kathmandu
```

`fromAd` and `fromInstant` answer different questions. `fromAd` converts a calendar date. `fromInstant` takes a moment in time and finds the date in Nepal at that moment. To convert "now", use `today()` or `fromInstant`. Don't build an AD date from `new Date()`, which gives the server's local date.

`fromInstant` only accepts ISO strings that end in `Z` or an offset such as `+05:45`. A string without one, like `"2026-10-18T10:00:00"`, would be read in the server's own time zone, so it throws a `RangeError`. A plain date like `"2026-10-18"` also throws, with a hint to use `fromAd`. An invalid `Date` or a moment outside the [supported range](#supported-range) throws a `RangeError` too.

Nepal's UTC offset has changed over time, and the library follows the [IANA time zone database](https://www.iana.org/time-zones): +05:45 since 1986, +05:30 from 1920 to 1985, and Kathmandu local mean time (+05:41:16) before 1920. It doesn't use `Intl` or the server's time zone settings.

### Other time zones

`fromInstant`, `today`, `startInstant` and the range methods take an `offsetMinutes` option to use a fixed UTC offset instead of Nepal's:

```ts
NepaliDate.fromInstant(payment.createdAt, { offsetMinutes: 0 }); // the date in UTC
NepaliDate.today({ offsetMinutes: -240 }); // today's date at UTC−04:00
```

The offset is in minutes east of UTC: `345` is +05:45 and `-240` is −04:00. That's the opposite sign to JavaScript's `Date#getTimezoneOffset()`, which returns `-345` in Nepal. The offset is fixed, so it doesn't follow daylight saving time, or Nepal's own offset history before 1986. It must be a whole number of minutes, less than a day either way.

## Database queries

A Nepali day, week, month or year starts at midnight in Kathmandu, which is 18:15 UTC the day before. `range` gives the exact start and end of the period as moments in time, so you can filter timestamp columns by Nepali dates:

```ts
// Also "day", "week", "fiscalQuarter", "chaumasik", "year" and "fiscalYear"
const { start, end } = NepaliDate.today().range("month");
// WHERE created_at >= start AND created_at < end
```

Weeks run Sunday to Saturday, because Sunday starts Nepal's working week. Pass `weekStartsOn` (0 = Sunday to 6 = Saturday) for another start: `range("week", { weekStartsOn: 1 })` runs Monday to Sunday. `adRange` and `startOf`/`endOf` take the same option.

The range is half-open: `start` is included and `end` is excluded, because `end` is the first moment of the next period. Always query with `>= start AND < end`. For any span of whole days, use `NepaliDate.rangeBetween(from, to)`, which includes both `from` and `to`.

### Fiscal periods

Pass `"fiscalYear"` for Nepal's fiscal year, from Shrawan 1 to the last day of Asar, `"fiscalQuarter"` for one of its three-month quarters, and `"chaumasik"` for one of the four-month periods the government reports in. Any date in the period gives the same result:

```ts
const date = new NepaliDate(2083, 4, 1); // fiscal year 2083/84, quarter 1, chaumasik 1

date.range("fiscalYear"); // { start: 2026-07-16T18:15:00.000Z, end: 2027-07-16T18:15:00.000Z }
date.adRange("fiscalYear"); // { start: "2026-07-17", end: "2027-07-17" }
date.startOf("fiscalYear"); // 2083-04-01
date.endOf("fiscalYear"); // 2084-03-32

date.range("fiscalQuarter"); // { start: 2026-07-16T18:15:00.000Z, end: 2026-10-17T18:15:00.000Z }
date.adRange("fiscalQuarter"); // { start: "2026-07-17", end: "2026-10-18" }
date.endOf("fiscalQuarter"); // 2083-06-31

date.range("chaumasik"); // { start: 2026-07-16T18:15:00.000Z, end: 2026-11-16T18:15:00.000Z }
date.adRange("chaumasik"); // { start: "2026-07-17", end: "2026-11-17" }
date.endOf("chaumasik"); // 2083-07-30

NepaliDate.today().range("fiscalQuarter"); // the current fiscal quarter
```

For a fiscal year that starts in another month, pass the same `fiscalYearStartMonth` to `range`, `adRange`, `startOf`, `endOf` and `isSame`:

```ts
const baisakh = { fiscalYearStartMonth: 1 };

date.range("fiscalYear", baisakh); // the same as date.range("year")
date.startOf("fiscalQuarter", baisakh); // 2083-04-01, the start of quarter 2
date.adRange("chaumasik", baisakh); // { start: "2026-04-14", end: "2026-08-17" }, Baisakh–Shrawan
```

A fiscal period that crosses from Chaitra into Baisakh runs past the [supported range](#supported-range) at either end, so its range throws a `RangeError`. With the default Shrawan start, that's fiscal years 1974/75 and 2086/87 and their third chaumasiks; every fiscal quarter fits. With a Baisakh start, every fiscal period fits.

### Why not `BETWEEN … 23:59:59`?

These common patterns all drop rows:

- **`BETWEEN '… 00:00:00' AND '… 23:59:59'`** misses anything stamped in the last second, such as `23:59:59.500`. Postgres stores microseconds, MySQL `DATETIME(3)` and `DATETIME(6)` store fractions of a second, and MongoDB stores milliseconds.
- **`BETWEEN '2026-09-17' AND '2026-10-17'` on a timestamp column** ends at `2026-10-17 00:00:00`, so it drops almost the whole last day.
- **UTC midnights as bounds** put the first 5 hours 45 minutes of each Nepali day into the previous day.

A half-open range has none of these problems, and back-to-back ranges never overlap or leave a gap.

### Choosing the value type

Different drivers want different types, so `range` and `rangeBetween` can return the bounds three ways:

```ts
date.range("month"); // { start: Date, end: Date } (the default)
date.range("month", { as: "iso" }); // { start: "2026-10-17T18:15:00.000Z", end: "…" }
date.range("month", { as: "ms" }); // { start: 1792260900000, end: … } (epoch milliseconds)
```

For `DATE` columns, which hold calendar dates with no time, use `adRange` and `adRangeBetween`. They return AD date strings with no time zone involved:

```ts
new NepaliDate(2083, 6, 10).adRange("month"); // { start: "2026-09-17", end: "2026-10-18" }
// WHERE sale_date >= '2026-09-17' AND sale_date < '2026-10-18'
```

### Postgres (node-postgres)

```ts
const { start, end } = NepaliDate.today().range("month");
await pool.query("SELECT * FROM payments WHERE created_at >= $1 AND created_at < $2", [start, end]);
```

This works for `timestamptz` columns. For a `timestamp` column (without time zone) that stores UTC, pass `{ as: "iso" }` instead. node-postgres sends a `Date` in the server's local time, and Postgres drops the offset when it reads a `timestamp`, so on a server outside UTC the bounds would shift.

For a `DATE` column:

```ts
const { start, end } = NepaliDate.today().adRange("month");
await pool.query("SELECT * FROM sales WHERE sale_date >= $1 AND sale_date < $2", [start, end]);
```

### MySQL (mysql2)

```ts
const pool = mysql.createPool({ /* … */ timezone: "Z" }); // send and read Dates as UTC

const { start, end } = NepaliDate.today().range("month");
const [rows] = await pool.query("SELECT * FROM payments WHERE created_at >= ? AND created_at < ?", [
  start,
  end,
]);
```

Without `timezone: "Z"`, mysql2 sends a `Date` in the server's local time. This assumes your `DATETIME` values are stored in UTC. For `TIMESTAMP` columns, also set the session time zone to UTC (`SET time_zone = '+00:00'`).

### MongoDB

```ts
const { start, end } = NepaliDate.today().range("month");
await db
  .collection("payments")
  .find({ createdAt: { $gte: start, $lt: end } })
  .toArray();
```

Pass `Date` objects, not ISO strings: MongoDB compares a string with a date field by type, so string bounds match nothing.

### Prisma

```ts
const { start, end } = NepaliDate.today().range("month");
await prisma.payment.findMany({ where: { createdAt: { gte: start, lt: end } } });
```

For a field marked `@db.Date`, Prisma expects a `Date` at UTC midnight. `new Date("2026-09-17")` creates exactly that:

```ts
const { start, end } = NepaliDate.today().adRange("month");
await prisma.sale.findMany({ where: { saleDate: { gte: new Date(start), lt: new Date(end) } } });
```

### Drizzle

```ts
import { and, gte, lt } from "drizzle-orm";

const { start, end } = NepaliDate.today().range("month");
await db
  .select()
  .from(payments)
  .where(and(gte(payments.createdAt, start), lt(payments.createdAt, end)));
```

Drizzle's `date()` columns use strings by default, so `adRange` bounds work as they are:

```ts
const { start, end } = NepaliDate.today().adRange("month");
await db
  .select()
  .from(sales)
  .where(and(gte(sales.saleDate, start), lt(sales.saleDate, end)));
```

## Recipes

These use node-postgres with a `timestamptz` column. For other databases, swap in the query from [Database queries](#database-queries); the dates work the same way.

### Monthly sales report

One row per Nepali month of the fiscal year so far, each month counted from midnight in Kathmandu:

```ts
const today = NepaliDate.today();
const months = NepaliDate.eachMonth(today.startOf("fiscalYear"), today);

const report = await Promise.all(
  months.map(async (month) => {
    const { start, end } = month.range("month");
    const { rows } = await pool.query(
      "SELECT coalesce(sum(amount), 0) AS total, count(*) AS orders FROM sales WHERE created_at >= $1 AND created_at < $2",
      [start, end],
    );
    return {
      month: month.format("MMMM YYYY"), // "Shrawan 2083", or "साउन २०८३" with { locale: "ne" }
      total: Number(rows[0].total),
      orders: Number(rows[0].orders),
    };
  }),
);
```

The last row is the current month to date. node-postgres returns `sum` and `count` as strings, hence `Number`.

That's one query per month. For a longer period, or daily figures, let the database group by the AD date in Kathmandu and add the days up by Nepali month:

```ts
const { start, end } = today.range("fiscalYear");
const { rows } = await pool.query(
  `SELECT (created_at AT TIME ZONE 'Asia/Kathmandu')::date::text AS day, sum(amount) AS total
   FROM sales WHERE created_at >= $1 AND created_at < $2
   GROUP BY 1 ORDER BY 1`,
  [start, end],
);

const totals = new Map<string, number>();
for (const { day, total } of rows) {
  const month = NepaliDate.fromAd(day).format("MMMM YYYY"); // day is "2026-07-17"
  totals.set(month, (totals.get(month) ?? 0) + Number(total));
}
```

`Asia/Kathmandu` includes Nepal's +05:30 offset before 1986, as `range` does.

### Fiscal-year filter

Let users pick a fiscal year such as `2082/83`, and filter by it:

```ts
const current = NepaliDate.today().fiscalYear().startYear;
const choices = Array.from(
  { length: 5 },
  (_, i) => new NepaliDate(current - i, 4, 1).fiscalYear().label,
);
// ["2083/84", "2082/83", "2081/82", "2080/81", "2079/80"]

/** The span of a fiscal year written like "2082/83". */
function fiscalYearRange(label: string) {
  const match = /^(\d{4})\/(\d{2})$/.exec(label);
  if (!match || (Number(match[1]) + 1) % 100 !== Number(match[2])) {
    throw new RangeError(`Expected a fiscal year like 2082/83, got ${JSON.stringify(label)}`);
  }
  // Shrawan 1 is the first day; any date in the fiscal year gives the same range.
  return new NepaliDate(Number(match[1]), 4, 1).range("fiscalYear");
}

const { start, end } = fiscalYearRange("2082/83"); // 2025-07-16T18:15Z to 2026-07-16T18:15Z
await pool.query("SELECT * FROM invoices WHERE issued_at >= $1 AND issued_at < $2", [start, end]);
```

A fiscal year outside the [supported range](#supported-range) also throws a `RangeError`, and so does 2086/87, which runs past its end.

Variations on the same pattern:

```ts
const fy = new NepaliDate(2082, 4, 1);

fy.addMonths(3).range("fiscalQuarter"); // quarter 2: Kartik–Poush 2082
fy.addMonths(8).range("chaumasik"); // the third chaumasik: Chaitra 2082–Asar 2083
fy.adRange("fiscalYear"); // { start: "2025-07-17", end: "2026-07-17" } for a DATE column

const today = NepaliDate.today();
NepaliDate.rangeBetween(today.startOf("fiscalYear"), today); // fiscal year to date
```

If your fiscal year starts in Baisakh, pass `{ fiscalYearStartMonth: 1 }` to `range`; the labels are then just the year, such as `2083`.

### Age check

Check a minimum age from a BS date of birth typed into a form:

```ts
function checkAge(birthText: string, minimumAge: number, onDate = NepaliDate.today()) {
  let birthDate: NepaliDate;
  try {
    birthDate = NepaliDate.parse(birthText); // "2065-04-15", or "२०६५-०४-१५"
  } catch {
    return { ok: false, error: "Enter the date of birth in BS, like 2065-04-15" };
  }
  if (birthDate.isAfter(onDate)) {
    return { ok: false, error: "The date of birth is in the future" };
  }
  const { years } = NepaliDate.age(birthDate, onDate);
  if (years < minimumAge) {
    return { ok: false, error: `You must be ${minimumAge} or older` };
  }
  return { ok: true, years };
}

checkAge("2065-04-15", 18); // { ok: true, years: 18 }
```

Pass `onDate` to check the age on another date, such as the last day to apply when a vacancy has an age limit: `checkAge(text, 18, NepaliDate.parse("2083-08-15"))`.

`birthDate.addYears(18)` is the day someone turns 18, which you can show to applicants who are too young. It throws a `RangeError` if that day is after 2086, the end of the [supported range](#supported-range). `addYears` and `age` agree on birthdays, including ones on a day the month lacks: someone born on `2067-03-32` turns 18 on `2085-03-31`, because Asar 2085 has 31 days. On `2085-03-30` they're 17.

## API reference

Every export, grouped by task. Each group links to the section that explains it with examples. Your editor shows the same descriptions, and more detail, when you hover over a name.

### Creating a date

Explained in [Quick start](#quick-start), [Parsing](#parsing) and [Nepal time](#nepal-time).

| API                                                                | What it does                                                                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `new NepaliDate(year, month, day)`                                 | The BS date. Months run from 1, Baisakh, to 12, Chaitra.                                                                             |
| `NepaliDate.parse(text)`                                           | Reads year-first BS text: `"2083-06-26"`, `"2083/6/26"` or `"२०८३-०६-२६"`.                                                           |
| `NepaliDate.parse(text, pattern, options?)`                        | Reads BS text written with [format tokens](#formatting), such as `"26 Asoj 2083"` with `"D MMMM YYYY"`. Options: `strict`, `locale`. |
| `NepaliDate.fromAd(text)`<br>`NepaliDate.fromAd(year, month, day)` | Converts an AD date to BS.                                                                                                           |
| `NepaliDate.fromInstant(instant, options?)`                        | The date in Nepal at a moment: a `Date`, epoch ms, or an ISO string with `Z` or an offset. Option: `offsetMinutes`.                  |
| `NepaliDate.today(options?)`                                       | Today's date in Nepal, whatever the server's time zone. Option: `offsetMinutes`.                                                     |

### Date parts and fiscal periods

Explained in [Reading a date](#reading-a-date) and [Fiscal periods](#fiscal-periods).

| API                                              | What it does                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `year`, `month`, `day`                           | The BS year, month (1–12) and day.                                                           |
| `dayOfWeek`                                      | 0 (Sunday) to 6 (Saturday).                                                                  |
| `dayOfYear`                                      | 1 for Baisakh 1, up to 365 or 366.                                                           |
| `daysInMonth`, `daysInYear`                      | 29 to 32, and 365 or 366.                                                                    |
| `fiscalYear(options?)`                           | `{ startYear, endYear, label }`, such as `label: "2083/84"`. Option: `fiscalYearStartMonth`. |
| `fiscalQuarter(options?)`, `chaumasik(options?)` | 1 to 4, and 1 to 3. Option: `fiscalYearStartMonth`.                                          |

### Converting and printing

Explained in [Quick start](#quick-start), [Storing and sending dates](#storing-and-sending-dates) and [Formatting](#formatting).

| API                         | What it does                                                                 |
| --------------------------- | ---------------------------------------------------------------------------- |
| `toAd()`                    | The AD date as `{ year, month, day }`.                                       |
| `toAdString()`              | The AD date as `"2026-10-12"`.                                               |
| `toString()`, `toJSON()`    | The BS date as `"2083-06-26"`.                                               |
| `format(pattern, options?)` | Text from tokens such as `"dddd, D MMMM YYYY"`. Options: `locale`, `digits`. |
| `startInstant(options?)`    | The moment the day starts in Nepal, as a `Date`. Option: `offsetMinutes`.    |

### Arithmetic

Explained in [Date arithmetic and comparison](#date-arithmetic-and-comparison) and [Adding months and years](#adding-months-and-years).

| API                                                | What it does                                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `addDays(n)`, `addWeeks(n)`                        | The date `n` days or weeks later, or earlier for a negative `n`.                                           |
| `addMonths(n)`, `addYears(n)`                      | The same day `n` months or years later, moved back to the month's last day if it's shorter.                |
| `startOf(unit, options?)`, `endOf(unit, options?)` | The first and last day of the period containing the date. Options: `weekStartsOn`, `fiscalYearStartMonth`. |

### Comparing and measuring

Explained in [Date arithmetic and comparison](#date-arithmetic-and-comparison) and [Age check](#age-check).

| API                                                              | What it does                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `isBefore(other)`, `isAfter(other)`, `isEqual(other)`            | Compare two dates. Use `isEqual`, not `===`, which compares objects.            |
| `isSame(other, unit, options?)`                                  | Whether both dates fall in the same week, month, fiscal year or other period.   |
| `isBetween(from, to)`                                            | Whether the date is from `from` to `to`, both included.                         |
| `NepaliDate.compare(a, b)`                                       | -1, 0 or 1, for `dates.sort(NepaliDate.compare)`.                               |
| `NepaliDate.min(...dates)`, `NepaliDate.max(...dates)`           | The earliest or latest date, passed separately or as one array.                 |
| `diffInDays(other)`, `diffInMonths(other)`, `diffInYears(other)` | Full days, months or years from `other` to this date, negative if it's earlier. |
| `NepaliDate.age(birthDate, onDate?)`                             | `{ years, months, days }`, on today's date in Nepal unless you pass `onDate`.   |

### Ranges for queries and reports

Explained in [Database queries](#database-queries), [Choosing the value type](#choosing-the-value-type) and [Recipes](#recipes).

| API                                                              | What it does                                                                                                                                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `range(unit, options?)`                                          | `{ start, end }`, the moments the period containing the date starts and the next one starts: query with `>= start AND < end`. Options: `as`, `offsetMinutes`, `weekStartsOn`, `fiscalYearStartMonth`. |
| `adRange(unit, options?)`                                        | `{ start, end }` as AD dates, for DATE columns. Options: `weekStartsOn`, `fiscalYearStartMonth`.                                                                                                      |
| `NepaliDate.rangeBetween(from, to, options?)`                    | The moments from the start of `from` to the end of `to`. Options: `as`, `offsetMinutes`.                                                                                                              |
| `NepaliDate.adRangeBetween(from, to)`                            | The AD dates from `from` to `to`, for DATE columns.                                                                                                                                                   |
| `NepaliDate.eachDay(from, to)`, `NepaliDate.eachMonth(from, to)` | Every day, or the first day of every month, from `from` to `to`.                                                                                                                                      |

### Calendar information

Explained in [Invalid dates](#invalid-dates), [Supported range](#supported-range) and [Custom spellings](#custom-spellings).

| API                                                                  | What it does                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `NepaliDate.isValid(year, month, day)`                               | Whether a BS date exists and is supported. Never throws.                        |
| `NepaliDate.daysInMonth(year, month)`, `NepaliDate.daysInYear(year)` | The length of a BS month or year.                                               |
| `NepaliDate.MIN_DATE`, `NepaliDate.MAX_DATE`                         | 1975-01-01 and 2086-12-30, the first and last supported dates.                  |
| `FIRST_YEAR`, `LAST_YEAR`, `LAST_OFFICIAL_YEAR`                      | 1975, 2086, and 2083, the last year whose official calendar has been published. |
| `MONTH_NAMES`                                                        | The 12 English month names, Baisakh first.                                      |
| `LOCALES`                                                            | The built-in `en` and `ne` names and digits, to start your own locale from.     |

### Units and options

A `unit` is one of `"day"`, `"week"`, `"month"`, `"fiscalQuarter"`, `"chaumasik"`, `"year"` or `"fiscalYear"`.

| Option                 | Used for                                   | Default                                   |
| ---------------------- | ------------------------------------------ | ----------------------------------------- |
| `weekStartsOn`         | Weeks                                      | `0`, Sunday                               |
| `fiscalYearStartMonth` | Fiscal years, quarters and chaumasiks      | `4`, Shrawan                              |
| `offsetMinutes`        | Reading or giving a moment in time         | Nepal's own UTC offset                    |
| `as`                   | The bounds from `range` and `rangeBetween` | `"date"`, or `"iso"` or `"ms"`            |
| `locale`               | `format` and `parse`                       | `"en"`, or `"ne"` or your own `Locale`    |
| `digits`               | `format`                                   | The locale's: `"latin"` or `"devanagari"` |
| `strict`               | `parse` with a pattern                     | `true`                                    |

The package also exports the TypeScript types for these: `AdDateRange`, `Age`, `Chaumasik`, `DateParts`, `DigitSystem`, `FiscalQuarter`, `FiscalYear`, `FiscalYearOptions`, `FormatOptions`, `InstantFormat`, `InstantFormatTypes`, `InstantOptions`, `InstantRange`, `Locale`, `LocaleName`, `MonthName`, `ParseOptions`, `PeriodOptions`, `RangeOptions`, `RangeUnit`, `WeekOptions` and `Weekday`.

### Errors

- `RangeError`: a date that doesn't exist or is outside the [supported range](#supported-range), text that can't be read, or an invalid option.
- `TypeError`: a value of the wrong type, such as a string where a `NepaliDate` is needed. Read strings with `NepaliDate.parse` first.

## Performance

A million conversions take well under a second, so converting dates won't be what slows down a report. Times for a million calls on an Apple M1 Pro with Node.js 24, over dates spread across the whole supported range:

| Call                                           | Time for a million |
| ---------------------------------------------- | ------------------ |
| `date.toAd()`                                  | 0.10 s             |
| `date.toAdString()`                            | 0.16 s             |
| `NepaliDate.fromInstant(ms)`                   | 0.22 s             |
| `NepaliDate.fromAd(year, month, day)`          | 0.33 s             |
| `NepaliDate.parse("2083-06-26")`               | 0.33 s             |
| `date.format("D MMMM YYYY")`                   | 0.38 s             |
| `NepaliDate.fromAd("2026-10-12")`              | 0.51 s             |
| `date.format("D MMMM YYYY", { locale: "ne" })` | 0.73 s             |

Run `npm run bench` in a clone of the repository to measure them on your machine.

## Supported range

|                     | BS         | AD         |
| ------------------- | ---------- | ---------- |
| First date          | 1975-01-01 | 1918-04-13 |
| Last official date  | 2083-12-30 | 2027-04-13 |
| Last supported date | 2086-12-30 | 2030-04-13 |

As moments in time, for `fromInstant` and `today`, the range runs from 1918-04-12T18:18:44Z (midnight in Kathmandu as 1975-01-01 began) up to, but not including, 2030-04-13T18:15:00Z. After that, `today()` throws a `RangeError` until a later release extends the table.

Years 1975–2083 match published calendars. **Years 2084–2086 are provisional**: their official panchangs are not published yet, so the table uses the month lengths that current calendar apps and libraries agree on. They may change in a later release once the official calendars come out: see [Versioning](#versioning).

The range is also available in code:

```ts
import { NepaliDate, FIRST_YEAR, LAST_YEAR, LAST_OFFICIAL_YEAR } from "nepali-date-system";

FIRST_YEAR; // 1975
LAST_YEAR; // 2086
LAST_OFFICIAL_YEAR; // 2083
NepaliDate.MIN_DATE; // 1975-01-01
NepaliDate.MAX_DATE; // 2086-12-30

const isProvisional = date.year > LAST_OFFICIAL_YEAR;
```

## Data sources

BS months are 29 to 32 days long, and their lengths change from year to year, so they can't be calculated with a simple formula. This library stores the length of every month in every supported year, plus one anchor: Baisakh 1, 1975 BS is 13 April 1918 AD. Every conversion counts days from that anchor.

The month lengths come from:

- **1975–2083:** [rjach/sambat](https://github.com/rjach/sambat) `data/calendar.csv` (Apache-2.0), which cross-checks up to 20 open-source tables.
- **2081–2083:** also checked against the published panchangs (Surya Panchanga 2081 and the national panchangs for 2082 and 2083).
- **2084–2086 (provisional):** agree with Hamro Patro (through [nepali-miti](https://github.com/alexblaze/nepali-miti)), [bikram-sambat](https://github.com/medic/bikram-sambat), [@sbmdkl/nepali-date-converter](https://www.npmjs.com/package/@sbmdkl/nepali-date-converter), [ad-bs-converter](https://www.npmjs.com/package/ad-bs-converter) and [nepali-datetime](https://pypi.org/project/nepali-datetime/) on PyPI.

### Years where sources disagree

In five years, open-source tables disagree about when a month starts. Each was settled from documents written at the time:

| BS year | Month start            | Evidence                               |
| ------- | ---------------------- | -------------------------------------- |
| 1989    | Mangsir 1 = 1932-11-16 | Rana-era documents that give a weekday |
| 1991    | Poush 1 = 1934-12-16   | Rana-era documents that give a weekday |
| 1993    | Shrawan 1 = 1936-07-15 | Rana-era documents that give a weekday |
| 2004    | Magh 1 = 1948-01-14    | 1948 deeds that give a weekday         |
| 2062    | Jestha 1 = 2005-05-15  | Newspaper datelines from 2005          |

Most of the weekday-dated documents come from the [Nepalica](https://nepalica.hadw-bw.de/nepal/) catalogue of historical Nepali documents.

### How the table is tested

The test suite checks the table against records that don't come from date-converter software:

- 116 historical events whose sources give both the BS and the AD date (1977–2083), converted in both directions.
- 49 documents with the weekday written on them.
- The AD date of Baisakh 1 for every year from 1975 to 2083.
- A round trip (BS → AD → BS) for every day in the supported range.

Every record cites its source: the original document, article or catalogue entry.

The table is also compared day by day with [nepali-date-converter](https://www.npmjs.com/package/nepali-date-converter) for BS 2000–2086, in both directions. The two agree everywhere except Baisakh–Jestha 2062, where 2005 newspaper datelines confirm this table, and the provisional years 2084–2086.

## Versioning

This package follows [semantic versioning](https://semver.org): an API change that could break your code only comes in a new major version.

Calendar data is the exception. When official calendars confirm or correct the provisional years, or a release adds new years, the change comes in a minor or patch release, never a major one, because a wrong calendar shouldn't wait for one. A correction to a year the table already has, including a provisional year confirmed by its official calendar, comes in a patch release. New years come in a minor release. Each data change is listed in the [changelog](CHANGELOG.md). If you store dates after `LAST_OFFICIAL_YEAR`, check the changelog when you upgrade.

## Contributing

Bug reports and calendar corrections are welcome in [GitHub issues](https://github.com/saurabbikramsen/nepali-date-system/issues). The **Wrong date** template asks for the source a correction needs, such as a published panchang or a dated document. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to work on the code, change the calendar data and release.

## License

[MIT](LICENSE)
