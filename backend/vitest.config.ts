import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "../shared"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env["TEST_DATABASE_URL"] ??
        "postgresql://postgres:password@localhost:5432/app_db_test",
      JWT_SECRET: "test_secret",
      PORT: "3001",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/db/index.ts"],
    },
  },
});
