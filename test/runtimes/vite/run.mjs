// Runs the checks in test/runtimes/checks.js in real browsers, inside a Vite app built for
// production, so the package is tested the way a browser app ships it: picked through
// package.json "exports", bundled, tree-shaken and minified. It builds the app in main.js, serves
// it with `vite preview`, opens it in each browser and reads the outcome main.js puts on the page.
//
// The package comes from a tarball made by `npm pack` at the repo root. It is installed with
// --no-save because the tarball's integrity changes on every build, so recording it in
// package.json or the lockfile would change them on every run and break `npm ci`. In this folder:
//
//   npm ci
//   npm install --no-save path/to/nepali-date-system-x.y.z.tgz
//   npx playwright install chromium firefox webkit
//   npm test
//
// It runs in Chromium, Firefox and WebKit. To run some of them, name them as arguments
// (`npm test -- firefox webkit`) or in BROWSERS (`BROWSERS=chromium npm test`). It prints one line
// per browser and exits with 1 if any browser fails or gives no result. To look at the page
// yourself, run `npx vite` here and open the address it prints.
import { createRequire } from "node:module";
import process from "node:process";
import { chromium, firefox, webkit } from "playwright";
import { build, preview, version as viteVersion } from "vite";

// The fixture folder, so the script works from any working directory.
const root = import.meta.dirname;
const browserTypes = { chromium, firefox, webkit };
// Long enough for a cold browser start on a slow CI machine; the checks themselves take
// milliseconds, so reaching it means the page never reported.
const timeout = 30_000;

const names =
  process.argv.length > 2
    ? process.argv.slice(2)
    : (process.env.BROWSERS || "chromium,firefox,webkit").split(/[\s,]+/).filter(Boolean);
const unknown = names.filter((name) => !Object.hasOwn(browserTypes, name));
if (names.length === 0 || unknown.length > 0) {
  const choices = Object.keys(browserTypes).join(", ");
  process.stderr.write(`Choose browsers from ${choices}; got ${names.join(", ") || "none"}\n`);
  process.exit(1);
}

// Fail early with the fix, rather than with a bundler error about an unresolved import.
let packageVersion;
try {
  packageVersion = createRequire(import.meta.url)("nepali-date-system/package.json").version;
} catch {
  process.stderr.write(
    "nepali-date-system is not installed here. Run `npm install --no-save <tarball>` first.\n",
  );
  process.exit(1);
}

await build({ root, logLevel: "warn" });
const server = await preview({ root, logLevel: "warn" });
const url = server.resolvedUrls.local[0];
process.stdout.write(`nepali-date-system ${packageVersion} in a Vite ${viteVersion} app\n`);

let failures = 0;
try {
  for (const name of names) {
    const { ok, line } = await runIn(name);
    if (!ok) failures++;
    process.stdout.write(`${line}\n`);
  }
} finally {
  await server.close();
}
process.exitCode = failures > 0 ? 1 : 0;

/** Opens the app in one browser and returns whether it passed, with a line describing it. */
async function runIn(name) {
  let browser;
  let label = name;
  // Errors that stop main.js before it can report, such as a bundle that fails to parse, only
  // show up on the page's error events, so keep them to explain a missing result.
  const pageErrors = [];
  try {
    browser = await browserTypes[name].launch({ timeout });
    label = `${name} ${browser.version()}`;
    const page = await browser.newPage();
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") pageErrors.push(message.text());
    });
    await page.goto(url, { timeout });
    const body = page.locator("body[data-result]");
    await body.waitFor({ timeout });
    if ((await body.getAttribute("data-result")) === "pass") {
      return { ok: true, line: `PASS ${label}: ${await body.getAttribute("data-count")} checks` };
    }
    return { ok: false, line: `FAIL ${label}: ${await page.locator("#output").textContent()}` };
  } catch (error) {
    // Playwright's messages carry a long call log after the first line, which says enough.
    const reason =
      error.name === "TimeoutError"
        ? `no result within ${timeout / 1000} s`
        : String(error.message).split("\n")[0];
    const details = pageErrors.length > 0 ? ` (page errors: ${pageErrors.join("; ")})` : "";
    return { ok: false, line: `FAIL ${label}: ${reason}${details}` };
  } finally {
    await browser?.close();
  }
}
