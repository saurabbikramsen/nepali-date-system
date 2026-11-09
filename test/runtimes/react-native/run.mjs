// Runs nepali-date-system the way a React Native app ships it. Metro bundles index.js with React
// Native's default Metro config and Babel preset, for Android and for iOS, and the Hermes VM runs
// each bundle twice: compiled to bytecode by hermesc, as a release build does, and as minified
// source, the bundle Metro makes when nothing turns minifying off. Every run executes the shared
// checks in test/runtimes/checks.js and prints one line.
//
// The library comes from the tarball `npm pack` makes at the repository root and is never
// recorded in package.json or package-lock.json, because its integrity hash changes with every
// build. From this folder:
//
//   npm ci
//   npm install --no-save ../../../nepali-date-system-<version>.tgz
//   npm test
//
// The first run builds the Hermes VM from source, which takes a few minutes; see hermes.mjs.
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { getHermes, hermesc, hermesVersion } from "./hermes.mjs";

const require = createRequire(import.meta.url);
const Metro = require("metro");
const { setFrameworkDefaults } = require("@react-native/metro-config");

const here = import.meta.dirname;
// Bundles go under node_modules, which git, Prettier and ESLint all skip.
const out = path.join(here, "node_modules", ".cache", "react-native-test");
const metro = `Metro ${require("metro/package.json").version}`;
const engine = `Hermes ${hermesVersion}`;

/** Loads metro.config.mjs the way `react-native bundle` loads an app's Metro config. */
async function loadConfig() {
  // The CLI sets these framework defaults before it loads the config, with one difference: it
  // runs react-native/setup-env before the entry, to set up the native side of an app, which a
  // bare Hermes VM doesn't have and this test doesn't install.
  setFrameworkDefaults({
    resolver: { platforms: ["ios", "android", "native"] },
    serializer: { getModulesRunBeforeMainModule: () => [] },
  });
  process.env.NODE_ENV = "production";
  return Metro.mergeConfig(await Metro.loadConfig({ cwd: here }), {
    // Release builds bundle with --reset-cache, so skip the transform cache rather than clear the
    // shared one in the temp folder, and keep the file map's cache with the bundles.
    cacheStores: [],
    fileMapCacheDirectory: out,
    // Pass on Metro's warnings but not its progress, so each run prints one line.
    reporter: {
      update(event) {
        if (event.type === "resolver_warning") process.stderr.write(`${event.message}\n`);
        if (event.type.startsWith("worker_std")) process.stderr.write(event.chunk);
      },
    },
  });
}

/** Bundles index.js like `react-native bundle --dev false`, returning the bundle's path. */
async function bundle(config, platform, minify) {
  const file = path.join(out, `${platform}${minify ? ".min" : ""}.js`);
  await Metro.runBuild(config, {
    entry: "./index.js",
    platform,
    dev: false,
    minify,
    bundleOut: file,
    sourceMap: true,
    sourceMapOut: `${file}.map`,
    sourceMapUrl: `${path.basename(file)}.map`,
  });
  return file;
}

/** Which of the package's builds Metro put in the bundle, such as dist/esm, from its source map. */
function libraryBuilds(file) {
  const map = JSON.parse(readFileSync(`${file}.map`, "utf8"));
  const sources = map.sections?.flatMap((section) => section.map.sources) ?? map.sources;
  const builds = sources
    .map((source) => source.split("/node_modules/nepali-date-system/")[1])
    .filter(Boolean)
    .map((source) => source.split("/").slice(0, 2).join("/"));
  return [...new Set(builds)].join(" and ");
}

/** Runs a program whose last argument is a file, throwing with its output if it fails. */
function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const status = result.status ?? result.signal;
    const what = `${path.basename(command)} ${path.basename(args.at(-1))}`;
    throw new Error(`${what} exited with ${status}\n${result.stdout}${result.stderr}`);
  }
  return result.stdout;
}

/** Runs a bundle or bytecode file on Hermes and prints a line saying how many checks passed. */
function runOnHermes(hermes, file, bundled, description) {
  const output = run(hermes, [file]);
  const count = /^(\d+) checks passed$/m.exec(output)?.[1];
  if (!count) throw new Error(`${path.basename(file)} didn't report its checks:\n${output}`);
  const from = `${metro} bundled ${libraryBuilds(bundled)}`;
  process.stdout.write(
    `React Native ${description} passed on ${engine} (${count} checks, ${from})\n`,
  );
}

try {
  rmSync(out, { recursive: true, force: true });
  const hermes = await getHermes();
  const config = await loadConfig();
  for (const platform of ["android", "ios"]) {
    // Release builds with Hermes turn Metro's minifier off and have hermesc optimize instead.
    const release = await bundle(config, platform, false);
    const bytecode = release.replace(/\.js$/, ".hbc");
    run(hermesc, ["-emit-binary", "-max-diagnostic-width=80", "-O", "-out", bytecode, release]);
    runOnHermes(hermes, bytecode, release, `${platform} release bytecode`);

    const minified = await bundle(config, platform, true);
    runOnHermes(hermes, minified, minified, `${platform} minified bundle`);
  }
} catch (error) {
  process.stderr.write(`React Native test failed: ${error.message}\n`);
  process.exitCode = 1;
}
