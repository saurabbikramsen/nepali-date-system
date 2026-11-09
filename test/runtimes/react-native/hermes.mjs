// Finds the Hermes tools for the React Native test: hermesc, the compiler a release build runs,
// and the hermes command-line VM, built from source the first time.
//
// React Native 0.88.1 depends on an exact hermes-compiler version, pinned here too, which ships
// hermesc for macOS and Linux but no VM to run code with. Meta stopped publishing a prebuilt
// hermes VM after v0.13.0 in August 2024: the facebook/hermes GitHub releases, the
// hermes-engine-cli npm package and jsvu and esvu, which download those releases, all stop at
// the engine before Hermes V1, the one React Native now ships, and that VM can't run today's
// bytecode. So this builds the VM from the facebook/hermes tag with the same version as
// hermes-compiler: the same engine and bytecode format an app gets.
//
// The command-line VM is not the exact build inside an app. It leaves out Intl, which this
// library doesn't use, and String.prototype.normalize comes from the host: Core Foundation on
// macOS, as on iOS, and ICU on Linux, where Android uses Java's Normalizer instead.
//
// Building needs CMake, Ninja or make, a C++ compiler, Python 3 and, on Linux, the ICU headers
// (macOS: brew install cmake ninja; Ubuntu: apt install cmake ninja-build libicu-dev). It takes
// a few minutes, and the VM is kept in .hermes/<version>/, which git ignores and CI can cache.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { availableParallelism } from "node:os";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const compiler = path.dirname(require.resolve("hermes-compiler/package.json"));

export const hermesVersion = require("hermes-compiler/package.json").version;

// The same choice React Native's Android and iOS build scripts make.
const bin = { darwin: "osx-bin", linux: "linux64-bin" }[process.platform];
if (!bin) throw new Error(`The React Native test runs on macOS and Linux, not ${process.platform}`);
export const hermesc = path.join(compiler, "hermesc", bin, "hermesc");

/** Returns the path of the hermes VM, building it first if this version isn't built yet. */
export async function getHermes() {
  const home = path.join(import.meta.dirname, ".hermes");
  const hermes = path.join(home, hermesVersion, "hermes");
  if (existsSync(hermes)) return hermes;

  // The source and build trees are removed afterwards, even after a failure, and before, in case
  // a build was interrupted, so Prettier and ESLint at the repository root, which don't read this
  // folder's .gitignore, never see them.
  const work = path.join(home, "work");
  const source = path.join(work, "source");
  const build = path.join(work, "build");
  rmSync(work, { recursive: true, force: true });
  mkdirSync(source, { recursive: true });
  try {
    const url = `https://github.com/facebook/hermes/archive/refs/tags/hermes-v${hermesVersion}.tar.gz`;
    process.stdout.write(`Building the Hermes ${hermesVersion} VM from ${url}\n`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Downloading ${url} failed with HTTP ${response.status}`);
    const archive = path.join(work, "source.tar.gz");
    writeFileSync(archive, new Uint8Array(await response.arrayBuffer()));
    run("tar", ["-xzf", archive, "-C", source, "--strip-components=1"]);

    const ninja = spawnSync("ninja", ["--version"]).status === 0;
    run("cmake", [
      ["-S", source, "-B", build],
      ninja ? ["-G", "Ninja"] : [],
      "-DCMAKE_BUILD_TYPE=Release",
      `-DHERMES_RELEASE_VERSION=${hermesVersion}`,
      "-DHERMES_ENABLE_TEST_SUITE=OFF",
    ]);
    run("cmake", ["--build", build, "--target", "hermes", "--parallel", availableParallelism()]);

    mkdirSync(path.dirname(hermes), { recursive: true });
    renameSync(path.join(build, "bin", "hermes"), hermes);
    return hermes;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function run(command, args) {
  execFileSync(command, args.flat().map(String), { stdio: ["ignore", "inherit", "inherit"] });
}
