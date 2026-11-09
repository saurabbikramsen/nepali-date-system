# Changelog

All notable changes to nepali-date-system. From 1.0.0 the package follows [semantic versioning](https://semver.org), with calendar data changes in minor or patch releases, as the README's [Versioning](README.md#versioning) section explains.

From 1.0.2, each release lists its changes as major, minor or patch changes. Earlier releases group them as Added, Changed, Fixed and Removed, as in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Release dates are on [npm](https://www.npmjs.com/package/nepali-date-system?activeTab=versions) and the [GitHub releases](https://github.com/saurabbikramsen/nepali-date-system/releases) page.

## 1.0.1

No code changes: this release improves the documentation and makes the package easier to find on npm.

### Added

- Descriptions for the rest of the API, which your editor shows when you hover over a name: the `NepaliDate` class and constructor, `year`, `month` and `day`, the `dayOfWeek`, `dayOfYear`, `daysInMonth` and `daysInYear` getters, `toAd`, `toAdString`, `toString` and `toJSON`, and the fields of the exported types.
- An [API reference](README.md#api-reference) in the README that lists every export with its options, and a [Performance](README.md#performance) section: a million conversions take 0.1 to 0.75 seconds.

### Changed

- A shorter npm description and more focused keywords, so the package is easier to find when you search npm for "nepali date".
- The [Versioning](README.md#versioning) policy says which release a calendar change comes in: a patch release for a correction to a year the table already has, and a minor release for new years.

## 1.0.0

The first stable release. The API is the same as 0.5.0, apart from the fixes below. From now on, a change that could break your code needs a new major version.

### Fixed

- Static methods such as `NepaliDate.compare` and `NepaliDate.parse` can be passed around on their own, as in `dates.sort(NepaliDate.compare)` or `texts.map(NepaliDate.parse)`, without typescript-eslint's `unbound-method` rule flagging them. They now declare `this: void`. Nothing changes at runtime.
- Source maps and declaration maps now work. The package includes the TypeScript source they point to, so "Go to definition" opens the real code.

### Added

- Supported Node.js versions in package.json `engines`: 18 and later. CI runs the built package on Node 18, 20, 22 and 24, as ESM and CommonJS.
- Links to the GitHub repository and issues, and a calendar data policy in the README.

## 0.5.0

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

## 0.4.2

### Changed

- A clearer package description on npm.

## 0.4.1

### Changed

- A clearer package description on npm.

## 0.4.0

### Added

- Date arithmetic: `addDays`, `addWeeks`, `addMonths` and `addYears`, which move to the month's last day when it's shorter.
- `startOf` and `endOf` for days, weeks, months and years, with the `weekStartsOn` option.
- Comparison: `isBefore`, `isAfter`, `isEqual`, `isSame`, `isBetween`, `NepaliDate.compare`, `NepaliDate.min` and `NepaliDate.max`.
- `NepaliDate.eachDay` and `NepaliDate.eachMonth`, for reports.

## 0.3.0

### Added

- `format()` with pattern tokens, in English or Nepali, with Latin or Devanagari digits.
- `NepaliDate.parse()` with a pattern, reading common month spellings and Devanagari digits.
- Custom locales, for your own month and weekday names.

## 0.2.0

### Added

- Nepal time: `NepaliDate.today()` and `NepaliDate.fromInstant()` give the date in Kathmandu on a server in any time zone, with an `offsetMinutes` option.
- Ranges for database queries: `range`, `rangeBetween`, `adRange`, `adRangeBetween` and `startInstant`.

## 0.1.0

### Added

- The first release: BS to AD and AD to BS conversion for BS 1975–2086, `NepaliDate.parse()`, validation with `NepaliDate.isValid()`, and calendar information such as `daysInMonth`, `dayOfWeek` and `dayOfYear`.
