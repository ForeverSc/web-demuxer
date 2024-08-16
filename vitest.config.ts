import { defineConfig } from "vite";
import copy from "rollup-plugin-copy";

export default defineConfig(() => ({
 test: {
    browser: {
      provider: 'webdriverio',
      enabled: true,
      name: 'chrome',
      headless: true,
      screenshotFailures: false
    },
  },
  plugins: [
    copy({
      targets: [
        {
          src: 'src/lib/*.{js,wasm}',
          dest: 'public/wasm-files'
        }
      ]
    })
  ],
}));
