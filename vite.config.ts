import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import babel from "@rollup/plugin-babel";

export default defineConfig(() => ({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "web-demuxer",
      fileName: "web-demuxer",
    },
    rollupOptions: {
      plugins: [
        babel({
          presets: [
            [
              "@babel/preset-env",
              {
                targets: "> 0.25%, not dead",
              },
            ],
          ],
          extensions: [".ts"],
          babelHelpers: "bundled",
        }),
      ],
    },
  },
  plugins: [dts({ rollupTypes: true })],
}));
