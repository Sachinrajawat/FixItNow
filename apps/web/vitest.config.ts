import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: true,
    include: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
    exclude: ["node_modules", ".next", "dist", "build", "coverage", "out"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
      exclude: [
        "app/**/layout.tsx",
        "app/**/loading.tsx",
        "app/**/error.tsx",
        "app/**/not-found.tsx",
        "app/api/**",
        "**/*.d.ts",
      ],
    },
  },
});
