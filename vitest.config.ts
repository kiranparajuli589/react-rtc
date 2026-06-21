import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "e2e/**"],
    coverage: {
      provider: "v8",
      include: ["app/helpers/**", "app/hooks/recorder/**", "app/components/core/mediaPlayer/utils.ts"],
    },
  },
  resolve: {
    alias: [
      { find: "@/config", replacement: path.resolve(__dirname, "app/config.ts") },
      { find: "@/constants/recordingTypes", replacement: path.resolve(__dirname, "app/constants/recordingTypes.ts") },
      { find: "@/constants/recording", replacement: path.resolve(__dirname, "app/constants/recording.ts") },
      { find: "@/constants/styleVariables", replacement: path.resolve(__dirname, "app/constants/styleVariables.ts") },
      { find: "@/helpers", replacement: path.resolve(__dirname, "app/helpers") },
      { find: "@/hooks", replacement: path.resolve(__dirname, "app/hooks") },
      { find: "@/core", replacement: path.resolve(__dirname, "app/components/core") },
      { find: "@/types", replacement: path.resolve(__dirname, "app/types") },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
});
