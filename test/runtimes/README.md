# Runtime tests

These run the built package in every runtime it supports, the way an app there loads it. Each one runs the same checks, from [checks.js](checks.js): conversion, parsing in English and Nepali, Nepal time, fiscal periods, ranges, arithmetic, formatting, errors and the exported constants. CI runs them all on every pull request.

| Runtime                      | How it loads the package                     | Run it                                      |
| ---------------------------- | -------------------------------------------- | ------------------------------------------- |
| Node.js 18, 20, 22 and 24    | Its own name, as ESM and as CommonJS         | `npm run build && npm run smoke`            |
| Deno                         | The same, through package.json "exports"     | `deno run --allow-read=. scripts/smoke.mjs` |
| Bun                          | The same                                     | `bun scripts/smoke.mjs`                     |
| Chromium, Firefox and WebKit | Bundled into a Vite app built for production | [vite/](vite/), below                       |
| React Native (Hermes)        | Bundled by Metro with React Native's config  | [react-native/](react-native/), below       |

The Node, Deno and Bun runs use [scripts/smoke.mjs](../../scripts/smoke.mjs) from the repository root, after `npm run build`.

## Browsers, through Vite

[vite/](vite/) is a small Vite app that imports the package by name, so Vite picks the ESM build through package.json "exports", bundles and minifies it. [run.mjs](vite/run.mjs) builds it, serves it and opens it in each browser with Playwright. It installs the package from the tarball `npm pack` makes, so it tests exactly the files that would be published:

```sh
npm run build
npm pack                                   # makes nepali-date-system-<version>.tgz
cd test/runtimes/vite
npm ci
npm install --no-save ../../../nepali-date-system-*.tgz
npx playwright install chromium firefox webkit   # once
npm test                                   # or: npm test -- firefox
```

`--no-save` keeps the tarball out of the fixture's package.json and lockfile, whose integrity hash would otherwise change with every build.

## React Native, through Metro and Hermes

[react-native/](react-native/) bundles an entry file the way `react-native bundle` does, with React Native's default Metro config and Babel preset, for Android and for iOS. [run.mjs](react-native/run.mjs) runs each bundle on Hermes, React Native's JavaScript engine, twice: compiled to bytecode with `hermesc`, as a release build does, and as minified source. The package comes from the tarball, as for Vite:

```sh
cd test/runtimes/react-native
npm ci
npm install --no-save ../../../nepali-date-system-*.tgz
npm test
```

There's no prebuilt Hermes VM for current React Native, so the first run builds one from the facebook/hermes source with the same version as the `hermes-compiler` React Native uses. That takes a few minutes and needs CMake, Ninja, a C++ compiler, Python 3 and, on Linux, the ICU headers: `brew install cmake ninja` on macOS, `apt install cmake ninja-build libicu-dev` on Ubuntu. Later runs reuse it from `.hermes/` and take seconds. [hermes.mjs](react-native/hermes.mjs) explains the choice and how the command-line VM differs from the one in an app.
