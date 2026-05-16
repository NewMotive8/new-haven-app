// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";

const bo = (p: string) => path.resolve(__dirname, "src/backoffice/src", p);
const shim = (p: string) => path.resolve(__dirname, "src/backoffice/next-shims", p);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: [
        // next/* shims so the backoffice's Next.js calls don't blow up under Vite
        { find: /^next\/router$/, replacement: shim("router.ts") },
        { find: /^next\/dynamic$/, replacement: shim("dynamic.tsx") },
        { find: /^next\/head$/, replacement: shim("head.tsx") },
        { find: /^next\/image$/, replacement: shim("image.tsx") },
        { find: /^next\/script$/, replacement: shim("script.tsx") },
        { find: /^next\/app$/, replacement: shim("app.ts") },
        { find: /^next\/link$/, replacement: shim("link.tsx") },

        // Backoffice baseUrl-style bare imports → src/backoffice/src/*
        { find: /^components\/(.*)$/, replacement: bo("components/$1") },
        { find: /^utils\/(.*)$/, replacement: bo("utils/$1") },
        { find: /^context\/(.*)$/, replacement: bo("context/$1") },
        { find: /^layouts\/(.*)$/, replacement: bo("layouts/$1") },
        { find: /^assets\/(.*)$/, replacement: bo("assets/$1") },
        { find: /^styles\/(.*)$/, replacement: bo("styles/$1") },
        { find: /^pages\/(.*)$/, replacement: bo("pages/$1") },
      ],
    },
  },
});
