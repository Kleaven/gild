import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "supabase/tests/**/*.test.ts",
    ],
    exclude: ["node_modules", ".next", "e2e"],
  },
});
