# nepali-date-system

Bikram Sambat (BS, the Nepali calendar) dates for JavaScript and TypeScript. Converts between BS and AD using a month-length table checked against published panchangs and dated historical documents.

It also gives you today's date in Nepal on a server in any time zone, and the exact start and end of Nepali days, months and years for database queries. Date arithmetic, formatting and fiscal-year helpers are planned for later releases.

## Install

```sh
npm install nepali-date-system
```

No runtime dependencies. Ships ESM and CommonJS builds with TypeScript types.

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

`parse` and `fromAd` only accept year-first strings. `"26/06/2083"` throws, because day-first and month-first dates can't be told apart.

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

A Nepali day, month or year starts at midnight in Kathmandu, which is 18:15 UTC the day before. `range` gives the exact start and end of the period as moments in time, so you can filter timestamp columns by Nepali dates:

```ts
const { start, end } = NepaliDate.today().range("month"); // also "day" and "year"
// WHERE created_at >= start AND created_at < end
```

The range is half-open: `start` is included and `end` is excluded, because `end` is the first moment of the next period. Always query with `>= start AND < end`. For any span of whole days, use `NepaliDate.rangeBetween(from, to)`, which includes both `from` and `to`.

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

## Supported range

|                     | BS         | AD         |
| ------------------- | ---------- | ---------- |
| First date          | 1975-01-01 | 1918-04-13 |
| Last official date  | 2083-12-30 | 2027-04-13 |
| Last supported date | 2086-12-30 | 2030-04-13 |

As moments in time, for `fromInstant` and `today`, the range runs from 1918-04-12T18:18:44Z (midnight in Kathmandu as 1975-01-01 began) up to, but not including, 2030-04-13T18:15:00Z. After that, `today()` throws a `RangeError` until a later release extends the table.

Years 1975–2083 match published calendars. **Years 2084–2086 are provisional**: their official panchangs are not published yet, so the table uses the month lengths that current calendar apps and libraries agree on. They may change in a later release once the official calendars come out.

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

## License

MIT
