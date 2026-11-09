import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The benchmark times the built package. Load it natively, as users do, rather than through
    // Vite's module runner, which slows calls between modules.
    server: { deps: { external: [/\/dist\/esm\//] } },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "html", "lcov"],
      // CI fails if coverage drops below these.
      thresholds: { lines: 95, statements: 95, functions: 95, branches: 95 },
    },
  },
});
