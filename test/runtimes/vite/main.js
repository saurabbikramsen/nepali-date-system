// The app run.mjs opens in each browser. It imports the package by its name, the way a Vite app
// would, so Vite picks the build through package.json "exports", and runs the same checks as the
// other runtime tests. The outcome goes on <body> for run.mjs to read: data-result is "pass" or
// "fail", data-count is the number of checks, and #output holds the count or the error. Errors
// are caught so a failing check is reported instead of leaving run.mjs waiting for a timeout.
import * as lib from "nepali-date-system";
import { runChecks } from "../checks.js";

const output = document.getElementById("output");
try {
  const count = runChecks(lib, "Vite");
  output.textContent = `${count} checks passed`;
  document.body.dataset.count = String(count);
  document.body.dataset.result = "pass";
} catch (error) {
  output.textContent = String(error);
  document.body.dataset.result = "fail";
}
