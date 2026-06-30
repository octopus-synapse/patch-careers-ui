/**
 * `@patch-careers/ui` — universal Tamagui component library.
 *
 * Three layers exported here, also reachable via subpath:
 *   - `./primitives` — atomic Tamagui-flavored building blocks
 *   - `./compounds`  — higher-order composers (Modal, Toast, Sheet, …)
 *   - `./icons`      — `<Icon>` wrapper for `lucide-react-native`
 *
 * Pure logic (variant resolvers, validators, helpers) lives under
 * `src/internal/` and is the only thing exercised by vitest — JSX
 * wrappers are tested at the app layer in PR #20 (Maestro/Playwright).
 */

export * from "./compounds";
export * from "./icons";
export { type HapticHandler, type HapticImpact, setHapticHandler } from "./internal/haptics";
export {
  clampScore,
  type EditorialToneKey,
  type ScoreGrade,
  type ScoreSeverity,
  type ScoreTone,
  scoreColors,
  scoreGrade,
  scoreIntent,
  scoreTone,
  toneToEditorialKey,
  toneToIntent,
} from "./internal/score-scale";
export type { ButtonVariant, Intent, Size, ThemeName } from "./internal/types";
export { useEditorialPalette } from "./internal/use-editorial-palette";
export { useThemeName } from "./internal/use-theme-name";
export * from "./primitives";
