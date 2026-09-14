import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { transformWithEsbuild } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Component tests — a second Vitest project, kept apart from the pure-logic
 * one (`vitest.config.ts`, node env, `*.spec.ts`) so those stay fast and
 * dependency-free. This one renders React Native components through
 * `react-native-web` in jsdom, the same substitution the web build makes,
 * so what a spec mounts is what the browser mounts.
 *
 * Specs are `*.dom.spec.tsx`. Render through `src/test/render.tsx`, which
 * wraps Tamagui and i18n exactly as the app does.
 */
const srcDir = fileURLToPath(new URL("./src", import.meta.url));
// Absolute, because the alias also has to resolve from inside `packages/*`,
// where pnpm's strict layout does not expose the app's dependencies.
const req = createRequire(import.meta.url);
// Resolve through the app's own node_modules (pnpm strict layout); some of
// these packages do not export `./package.json`, so walk from the entry.
const appModules = fileURLToPath(new URL("./node_modules", import.meta.url));
const pkgDir = (name: string): string => `${appModules}/${name}`;
const reactNativeWeb = dirname(req.resolve("react-native-web/package.json"));
const reactNativeSvg = pkgDir("react-native-svg");

export default defineConfig({
  plugins: [
    {
      // Expo packages ship JSX inside `.js` (Metro accepts it); Vite only
      // parses JSX in `.jsx`/`.tsx`. Transpile those on the way in.
      name: "expo-jsx-in-js",
      async transform(code, id) {
        if (!/node_modules\/(expo-[^/]+|@expo\/[^/]+)\/.*\.js$/.test(id)) return null;
        if (!code.includes("<")) return null;
        return transformWithEsbuild(code, id, { loader: "jsx", jsx: "automatic" });
      },
    },
    {
      // lucide-react-native@1.16's ESM entry re-exports `LucideProvider` from a
      // `context.mjs` that never defines it. Metro tolerates the dangling
      // re-export; Vite's linker does not. Its CJS build cannot be used
      // instead: a native `require("react-native-svg")` inside an
      // externalized module escapes the aliases and lands on Flow-syntax RN.
      name: "lucide-dangling-reexport",
      transform(code, id) {
        if (!id.endsWith("lucide-react-native/dist/esm/lucide-react-native.mjs")) return null;
        return code.replace(
          "export { LucideProvider, useLucideContext } from './context.mjs';",
          "export { useLucideContext } from './context.mjs';\nexport const LucideProvider = ({ children }) => children;",
        );
      },
    },
  ],
  // Expo/RN packages read `__DEV__` at module load, as Metro would define it.
  define: { __DEV__: "true" },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["apps/client/src/**/*.dom.spec.tsx"],
    setupFiles: ["apps/client/test-setup.dom.ts"],
    server: {
      deps: {
        // Externalized packages are loaded by Node directly and their own
        // `require("react-native")` never sees the aliases above — it lands on
        // the real, Flow-syntax RN and throws. Inlining routes them through Vite.
        inline: [
          /lucide-react-native/,
          /react-native-svg/,
          /@tamagui\//,
          /tamagui/,
          /expo-/,
          /@expo\//,
          /react-native-web/,
        ],
      },
    },
  },
  resolve: {
    // Metro's platform extensions, web first — how the web bundle picks
    // `foo.web.tsx` over `foo.tsx`. Without this, packages that ship a Flow
    // RN entry and a JS web entry side by side load the wrong one.
    extensions: [".web.tsx", ".web.ts", ".web.js", ".tsx", ".ts", ".js", ".mjs", ".json"],
    mainFields: ["browser", "module", "main"],
    conditions: ["browser", "module", "import", "default"],
    alias: [
      { find: /^@\//, replacement: `${srcDir}/` },
      { find: /^react-native$/, replacement: reactNativeWeb },
      // Its `main`/`module` entries carry Flow syntax; the web build is plain JS.
      {
        find: /^react-native-svg$/,
        replacement: `${reactNativeSvg}/lib/module/ReactNativeSVG.web.js`,
      },
      // Reanimated's own mock still touches TurboModuleRegistry, which
      // react-native-web lacks; a local stub keeps the surface we use.
      {
        find: /^react-native-reanimated$/,
        replacement: fileURLToPath(new URL("./src/test/stubs/reanimated.tsx", import.meta.url)),
      },
      {
        find: /^expo-image$/,
        replacement: fileURLToPath(new URL("./src/test/stubs/expo-image.tsx", import.meta.url)),
      },
      {
        find: /^react-native-safe-area-context$/,
        replacement: fileURLToPath(
          new URL("./src/test/stubs/safe-area-context.tsx", import.meta.url),
        ),
      },
      {
        find: /^react-native-worklets$/,
        replacement: fileURLToPath(new URL("./src/test/stubs/worklets.ts", import.meta.url)),
      },
    ],
  },
});
