/**
 * Metro config WITHOUT Nx (bypass temporário pra debug expo-router app/ resolution).
 * Original config em metro.config.js.bak — restore com `mv metro.config.js.bak metro.config.js`.
 *
 * Responsibilities:
 * 1. Workspace-aware: watchFolders + nodeModulesPaths apontam pro root do monorepo
 *    (pnpm hoista deps lá).
 * 2. Symlinks habilitados (pnpm usa symlinks heavy).
 * 3. SVG transformer pra `*.svg` virar React component.
 */

const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Workspace awareness
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// pnpm symlinks + package exports
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Pin Tamagui + React Native + React + Reanimated pra uma única resolução.
// Em pnpm monorepo, Metro pode resolver o mesmo pacote via paths simbólicos
// diferentes (apps/app/node_modules/X vs ../../node_modules/X) e isso
// instancia o módulo 2 vezes — Tamagui detecta e cai em "global config
// fallback" (warning) + React fica em duplicate version mismatch (erro).
// Aliasar pra paths absolutos do workspace root garante singleton.
const singletonPackages = [
  "react",
  "react-dom",
  "react-native",
  "react-native-reanimated",
  "react-native-gesture-handler",
  "tamagui",
  "@tamagui/core",
  "@tamagui/web",
  "@tamagui/portal",
  "@tamagui/sheet",
  "@tamagui/toast",
  "@tamagui/config",
  "@tamagui/animations-react-native",
  "@tanstack/react-query",
  "zustand",
];
config.resolver.alias = {
  ...(config.resolver.alias ?? {}),
  ...Object.fromEntries(
    singletonPackages.map((pkg) => [
      pkg,
      path.resolve(workspaceRoot, "node_modules", pkg),
    ]),
  ),
};

// SVG support (react-native-svg-transformer)
const { assetExts, sourceExts } = config.resolver;
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer",
);
config.resolver.assetExts = assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...sourceExts, "cjs", "mjs", "svg"];

module.exports = config;
