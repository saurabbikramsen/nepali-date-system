# Contributing to nepali-date-system

Thanks for helping. Reports of wrong dates are the most useful contribution of all: the library is only as good as its calendar table.

## Reporting a wrong date

Open an issue with the [Wrong date](https://github.com/saurabbikramsen/nepali-date-system/issues/new?template=wrong-date.yml) template. It asks for the BS date, the AD date the library gives, the AD date your source gives, and the source itself.

A correction needs a source that someone else can check. In order of preference:

1. The national panchang from Nepal Panchanga Nirnayak Bikas Samiti, or another published panchang such as Surya Panchanga, with the year and page.
2. A dated document that gives the weekday, or both the BS and the AD date: deeds, letters, official notices.
3. A newspaper dateline that gives both dates.

Calendar apps and other converters often copy each other's tables, so they can show that tables disagree but can't settle which one is right. The README's [Data sources](README.md#data-sources) section explains how earlier disagreements were settled.

For anything else, use the [Bug report](https://github.com/saurabbikramsen/nepali-date-system/issues/new?template=bug-report.yml) template.

## Working on the code

You need Node.js 24, or 22.19 and later, for the development tools. The published package itself supports Node.js 18 and later.

```sh
git clone https://github.com/saurabbikramsen/nepali-date-system.git
cd nepali-date-system
npm ci
```

CI runs each of these on every pull request, so run the ones your change touches before you push:

| Command                          | What it checks                                                                |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `npm test`                       | The test suite                                                                |
| `npm run test:coverage`          | The test suite, failing if coverage of `src/` drops below 95%                 |
| `npm run lint`                   | ESLint                                                                        |
| `npm run format:check`           | Prettier. `npm run format` fixes it.                                          |
| `npm run typecheck`              | TypeScript                                                                    |
| `npm run build && npm run smoke` | The built package through its own name, as ESM and CommonJS                   |
| `npm run size`                   | Bundle sizes, and that importing `LOCALES` or a constant leaves out the rest  |
| `npm run bench`                  | How long a million conversions take. CI doesn't run it; use it for speed-ups. |

CI also runs the tests with the time zone set to UTC, America/New_York and Asia/Kathmandu, and runs the built package on Node.js 18 to 24, Deno, Bun, a Vite app in Chromium, Firefox and WebKit, and React Native. [test/runtimes/README.md](test/runtimes/README.md) explains how to run those yourself.

### What a pull request needs

- **Tests** for the change. Results are fixed values, never computed with the code under test.
- **TSDoc** on anything exported: a plain sentence on what it gives, its units and ranges, and what it throws. Your editor shows it to users when they hover over a name.
- **The README** updated if the change is visible to users, including the [API reference](README.md#api-reference).
- **A changeset**, described below, if the change affects what users get.

## Changing calendar data

Month lengths are in `MONTH_LENGTHS` in [src/defined.ts](src/defined.ts), one row of 12 numbers per BS year. To correct a year or confirm a provisional one:

1. Change the row, and mark it with a comment that names the source, as the verified years 2081–2083 have.
2. When an official calendar confirms a provisional year, raise `LAST_OFFICIAL_YEAR` in the same file and add the year's Baisakh 1 to [test/fixtures/baisakh1.ts](test/fixtures/baisakh1.ts).
3. Add the evidence to [test/fixtures/documented-dates.ts](test/fixtures/documented-dates.ts): `DOCUMENTED_DATES` for a record with both a BS and an AD date, or `WEEKDAY_RECORDS` for one with a BS date and its weekday. Every entry cites its source.
4. If the change makes this table disagree with nepali-date-converter, add the days to the known differences in [test/cross-library.test.ts](test/cross-library.test.ts), with a comment saying which source settles it.
5. Update the README's [Supported range](README.md#supported-range) and [Data sources](README.md#data-sources) sections.
6. Add a changeset that says which years changed and what the source is. Users who stored dates in those years need to know.

## Changesets

Every pull request that changes what users get needs a changeset: a short Markdown file in [.changeset/](.changeset/) that becomes its entry in [CHANGELOG.md](CHANGELOG.md). Create one with:

```sh
npx changeset
```

Choose the release type by what the change means for someone upgrading:

| Type  | When                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------ |
| major | Code that worked could break: a removed or renamed export, a changed signature, a new error for input that used to work. |
| minor | Something new: a method, an option, an export, or new years in the calendar table.                                       |
| patch | A fix, including a corrected month length in a year the table already has, and documentation that ships in the package.  |

Calendar data never needs a major release, as the README's [Versioning](README.md#versioning) section explains, even though a correction changes results. Write the summary for someone deciding whether to upgrade: what changed, and what they need to do, if anything.

Changes that users don't see, such as tests, CI or development tools, don't need a changeset.

## Releasing

Maintainers release from GitHub; nobody publishes from their own machine.

1. Merging a pull request with changesets into `main` makes the [Release workflow](.github/workflows/release.yml) open, or update, a pull request called **Release**. It bumps the version in `package.json` and `package-lock.json` and moves the changesets into `CHANGELOG.md`.
2. Check the version and changelog in that pull request, and merge it when you want to release.
3. The workflow then runs the type check, tests and smoke test on the merged commit, publishes to npm with provenance, tags the commit `v<version>` and creates a GitHub release with the changelog entry.

The release pull request is opened by GitHub Actions, so GitHub doesn't run the CI workflow on it. It only changes the version and changelog, which the release workflow tests before publishing anyway. To run CI on it too, close and reopen it.

### One-time setup

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers), so there is no npm token to store or renew. Before the first release from CI:

1. On npmjs.com, open the package's **Settings**, and under **Trusted Publisher** choose **GitHub Actions** with owner `saurabbikramsen`, repository `nepali-date-system` and workflow `release.yml`.
2. In the GitHub repository settings, under **Actions → General → Workflow permissions**, turn on **Allow GitHub Actions to create and approve pull requests**.
3. Once a release from CI has worked, set **Publishing access** on npmjs.com to require two-factor authentication and disallow tokens, so only the workflow can publish.
