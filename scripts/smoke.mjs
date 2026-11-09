// Runs the built package the way an installed user would, through its own name, as ESM and as
// CommonJS. CI runs it on every Node version that package.json "engines" claims, and on Deno and
// Bun, so it uses no test tools. Run `npm run build` first, then `npm run smoke`.
import { createRequire } from "node:module";
import process from "node:process";
import * as esm from "nepali-date-system";
import { runChecks } from "../test/runtimes/checks.js";

const require = createRequire(import.meta.url);
const cjs = require("nepali-date-system");

const count = runChecks(esm, "ESM") + runChecks(cjs, "CommonJS");
const runtime = globalThis.Deno
  ? `Deno ${globalThis.Deno.version.deno}`
  : process.versions.bun
    ? `Bun ${process.versions.bun}`
    : `Node ${process.version}`;
process.stdout.write(`Smoke test passed on ${runtime}, ESM and CommonJS (${count} checks)\n`);
