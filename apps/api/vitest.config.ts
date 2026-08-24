import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node environment: these suites test server-side accounting, not the DOM.
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Ledger tests share module-level state through their own fixtures, so
    // isolate files from each other.
    isolate: true,
  },
});
