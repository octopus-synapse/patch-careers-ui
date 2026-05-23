/**
 * Babel config for the Expo Router universal app.
 *
 * - `babel-preset-expo` is required by Expo SDK 54 (replaces the older
 *   `metro-react-native-babel-preset`)
 * - `@tamagui/babel-plugin` performs ahead-of-time compilation of
 *   styled props → StyleSheet (D11, ~3-5× perf gains in long lists).
 *   We point it at our config + the shared UI package so optimizations
 *   transfer across the monorepo.
 * - `react-native-reanimated/plugin` MUST be listed last (Reanimated
 *   docs) — it transforms worklet boundaries.
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
          disableExtraction: process.env["NODE_ENV"] === "development",
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
