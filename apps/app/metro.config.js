/**
 * Metro config for the universal Expo app inside the pnpm + Nx monorepo.
 *
 * Two responsibilities:
 *
 * 1. **Workspace awareness**: Metro must `watchFolders` the workspace
 *    root so changes in `packages/*` invalidate caches. It must also
 *    look up `node_modules` from both the app and the workspace root —
 *    pnpm hoists shared deps to the root.
 *
 * 2. **SVG support**: react-native-svg-transformer turns `*.svg`
 *    imports into React components (parity with web bundlers).
 *
 * Nx `withNxMetro` adds project-graph-aware resolution so workspace
 * libraries are findable without explicit aliases.
 */

const { withNxMetro } = require("@nx/expo");
const { getDefaultConfig } = require("@expo/metro-config");
const { mergeConfig } = require("metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const defaultConfig = getDefaultConfig(projectRoot);
const { assetExts, sourceExts } = defaultConfig.resolver;

const customConfig = {
  cacheVersion: "app",
  watchFolders: [workspaceRoot],
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...sourceExts, "cjs", "mjs", "svg"],
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(workspaceRoot, "node_modules"),
    ],
    // pnpm uses symlinks heavily; Metro >= 0.79 needs this opt-in to
    // resolve them correctly without infinite traversal.
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
  },
};

module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  debug: false,
  extensions: [],
  watchFolders: [],
});
