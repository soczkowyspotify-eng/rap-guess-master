// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "#tanstack-start-plugin-adapters": fileURLToPath(
          new URL("./node_modules/@tanstack/start-client-core/dist/esm/fake-entries/plugin-adapters.js", import.meta.url),
        ),
      },
    },
  },
  tanstackStart: {
    importProtection: {
      behavior: "mock",
      client: {
        // Keep default *.server.* file block but drop the extra **/server/** rule
        // — this project already has server-fn modules under src/server/ that the
        // splitter handles correctly.
        files: ["**/*.server.*"],
        specifiers: ["server-only"],
      },
    },
  },
});
