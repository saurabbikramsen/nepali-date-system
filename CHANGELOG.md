# Changelog

All notable changes to nepali-date-system. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). From 1.0.0 the package follows [semantic versioning](https://semver.org), with calendar data changes in minor or patch releases, as the README's [Versioning](README.md#versioning) section explains.

## [1.0.0] - 2026-11-09

The first stable release. The API is the same as 0.5.0, apart from the fixes below. From now on, a change that could break your code needs a new major version.

### Fixed

- Static methods such as `NepaliDate.compare` and `NepaliDate.parse` can be passed around on their own, as in `dates.sort(NepaliDate.compare)` or `texts.map(NepaliDate.parse)`, without typescript-eslint's `unbound-method` rule flagging them. They now declare `this: void`. Nothing changes at runtime.
- Source maps and declaration maps now work. The package includes the TypeScript source they point to, so "Go to definition" opens the real code.

### Added

- Supported Node.js versions in package.json `engines`: 18 and later. CI runs the built package on Node 18, 20, 22 and 24, as ESM and CommonJS.
- Links to the GitHub repository and issues, and a calendar data policy in the README.

## [0.5.0] - 2026-10-30

### Removed

- **Breaking:** `NepaliDate.fromDays()`. It exposed an internal day number that would change meaning if the supported range ever starts earlier. Use the constructor, `NepaliDate.fromAd()` or `NepaliDate.parse()` instead.

### Added

- Fiscal years, quarters and chaumasik periods: `fiscalYear()`, `fiscalQuarter()` and `chaumasik()`, and the units `"fiscalYear"`, `"fiscalQuarter"` and `"chaumasik"` for `range`, `adRange`, `startOf`, `endOf` and `isSame`.
- The `fiscalYearStartMonth` option, for organizations whose fiscal year doesn't start in Shrawan.
- `diffInDays()`, `diffInMonths()` and `diffInYears()`, counting full units.
- `NepaliDate.age(birthDate, onDate?)`, which returns `{ years, months, days }`.
- README recipes: a monthly sales report, a fiscal-year filter and an age check.

### Changed

- `dayOfWeek` is typed as `Weekday` (0–6) instead of `number`.

## [0.4.2] - 2026-10-21

### Changed

- A clearer package description on npm.

## [0.4.1] - 2026-10-21

### Changed

- A clearer package description on npm.

## [0.4.0] - 2026-10-21

### Added

- Date arithmetic: `addDays`, `addWeeks`, `addMonths` and `addYears`, which move to the month's last day when it's shorter.
- `startOf` and `endOf` for days, weeks, months and years, with the `weekStartsOn` option.
- Comparison: `isBefore`, `isAfter`, `isEqual`, `isSame`, `isBetween`, `NepaliDate.compare`, `NepaliDate.min` and `NepaliDate.max`.
- `NepaliDate.eachDay` and `NepaliDate.eachMonth`, for reports.

## [0.3.0] - 2026-10-21

### Added

- `format()` with pattern tokens, in English or Nepali, with Latin or Devanagari digits.
- `NepaliDate.parse()` with a pattern, reading common month spellings and Devanagari digits.
- Custom locales, for your own month and weekday names.

## [0.2.0] - 2026-10-20

### Added

- Nepal time: `NepaliDate.today()` and `NepaliDate.fromInstant()` give the date in Kathmandu on a server in any time zone, with an `offsetMinutes` option.
- Ranges for database queries: `range`, `rangeBetween`, `adRange`, `adRangeBetween` and `startInstant`.

## [0.1.0] - 2026-10-18

### Added

- The first release: BS to AD and AD to BS conversion for BS 1975–2086, `NepaliDate.parse()`, validation with `NepaliDate.isValid()`, and calendar information such as `daysInMonth`, `dayOfWeek` and `dayOfYear`.
