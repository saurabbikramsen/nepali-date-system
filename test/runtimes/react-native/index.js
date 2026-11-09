// The app entry Metro bundles. It imports the library by its package name, as an app would, and
// reports through print, which the hermes command-line VM provides in place of an app's console.
// A failing check throws, which makes the VM exit with an error.
import * as lib from "nepali-date-system";
import { runChecks } from "../checks.js";

print(`${runChecks(lib, "React Native")} checks passed`);
