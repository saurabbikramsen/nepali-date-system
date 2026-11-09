import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    // At any depth: the runtime test apps in test/runtimes build into their own dist folders.
    ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // The Vite test app runs in the browser.
    files: ["test/runtimes/vite/main.js"],
    languageOptions: { globals: { document: "readonly" } },
  },
  {
    // The React Native test: Babel's config is CommonJS, the app runs on the Hermes VM, which
    // prints with print, and the script that builds the VM downloads it with Node's fetch.
    files: ["test/runtimes/react-native/babel.config.js"],
    languageOptions: { sourceType: "commonjs" },
  },
  {
    files: ["test/runtimes/react-native/index.js"],
    languageOptions: { globals: { print: "readonly" } },
  },
  {
    files: ["test/runtimes/react-native/hermes.mjs"],
    languageOptions: { globals: { fetch: "readonly" } },
  },
  prettier,
);
