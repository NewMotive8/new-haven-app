import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/audit/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    sequence: { concurrent: false },
    poolOptions: {
      threads: { singleThread: true, minThreads: 1, maxThreads: 1 },
    },
    hookTimeout: 30_000,
    testTimeout: 30_000,
    setupFiles: ["tests/audit/setup.ts"],
    reporters: ["verbose"],
  },
});
