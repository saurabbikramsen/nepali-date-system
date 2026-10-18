# nepali-date-system

Bikram Sambat (BS, the Nepali calendar) dates for JavaScript and TypeScript. Converts between BS and AD using a month-length table checked against published panchangs and dated historical documents.

Version 0.1 covers conversion only. Nepal-time handling (`today()`), database query ranges, date arithmetic, formatting and fiscal-year helpers are planned for later releases.

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
NepaliDate.parse("2083-06-26"); // also accepts "2083/06/26" and "2083.6.26"
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
date.DayOfWeek; // 1 (0 = Sunday … 6 = Saturday)
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

### Today's date

There is no `today()` yet. `fromAd` converts a calendar date, not a moment in time, so pass in the date as it is in Nepal. Building the date from `new Date()` gives the server's local date, which is wrong on most servers for part of each day. Until `today()` ships, read the Kathmandu date with `Intl`:

```ts
// en-CA formats dates as YYYY-MM-DD
const kathmandu = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" });
NepaliDate.fromAd(kathmandu.format(new Date()));
```

## Supported range

|                     | BS         | AD         |
| ------------------- | ---------- | ---------- |
| First date          | 1975-01-01 | 1918-04-13 |
| Last official date  | 2083-12-30 | 2027-04-13 |
| Last supported date | 2086-12-30 | 2030-04-13 |

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

BS months are 29 to 32 days long, and their lengths change from year to year, so they can't be calculated with a simple formula. This library stores the length of every month in every supported year ([src/defined.ts](src/defined.ts)), plus one anchor: Baisakh 1, 1975 BS is 13 April 1918 AD. Every conversion counts days from that anchor.

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

Each record links to its source in [test/fixtures/documented-dates.ts](test/fixtures/documented-dates.ts).

### Found a wrong date?

[Open an issue](https://github.com/saurabbikramsen/nepali-date-system/issues) with the date, the result you expected and where it comes from, such as a printed patro, an official notice or a dated document.

## License

[MIT](LICENSE)
