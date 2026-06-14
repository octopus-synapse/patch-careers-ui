/**
 * Babel config for the Expo Router universal app.
 *
 * - `babel-preset-expo` is required by Expo SDK 54 (replaces the older
 *   `metro-react-native-babel-preset`)
 * - `@tamagui/babel-plugin` performs ahead-of-time compilation of
 *   styled props → StyleSheet (D11, ~3-5× perf gains in long lists).
 *   We point it at our config + the shared UI package so optimizations
 *   transfer across the monorepo.
 * - Reanimated v4 worklet transforms are injected automatically by
 *   `babel-preset-expo` (→ `react-native-worklets/plugin` when the
 *   worklets package is installed). Do NOT add the legacy
 *   `react-native-reanimated/plugin` here — duplicate plugins crash
 *   at runtime in Expo Go.
 */
module.exports = (api) => {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          components: ["tamagui", "@patch-careers/ui"],
          config: "./tamagui.config.ts",
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === "development",
        },
      ],
    ],
  };
};
