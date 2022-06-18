import { defineConfig } from "vitest/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import pkg from "./package.json" assert { type: "json" };

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "dist/lib",
    lib: {
      entry: resolve(root, "index.ts"),
      name: pkg.name,
      fileName: "index",
    },
    rollupOptions: {
      output: [
        {
          dir: "dist/lib",
          format: "es",
          exports: "named",
          entryFileNames: "[name].mjs",
        },
        {
          dir: "dist/lib",
          format: "cjs",
          exports: "named",
          entryFileNames: "[name].cjs",
        },
      ],

      external: Object.keys(pkg.dependencies),
    },
  },
  test: {
    include: ["tests/**/*.spec.ts"],
  },
});
