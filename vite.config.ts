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
      // output: {
      //   exports: "named",
      //   entryFileNames: (arg) => {
      //     console.log(arg.name);
      //     return "[name]/[name].[format].js";
      //   },
      //   globals: {
      //     prettier: "prettier",
      //     "@babel/core": "BabelCore",
      //     "@babel/plugin-transform-typescript":
      //       "BabelPluginTransformTypescript",
      //     "@babel/plugin-syntax-decorators": "BabelPluginSyntaxDecorators",
      //   },
      // },
      external: Object.keys(pkg.dependencies),
    },
  },
  test: {
    include: ["tests/**/*.spec.ts"],
  },
});
