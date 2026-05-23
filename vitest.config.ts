import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["tests/audit/**/*.test.ts"],
    setupFiles: ["tests/audit/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Serial execution — probes share an in-memory idempotency cache on the
    // server and inspect shared brand-scoped state. Avoid parallel collision.
    pool: "threads",
    poolOptions: {
      threads: { singleThread: true, minThreads: 1, maxThreads: 1 },
    },
    fileParallelism: false,
    reporters: ["verbose"],
  },
});
