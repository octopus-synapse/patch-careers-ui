/**
 * `<ScoreBar>` — a 0-100 score as a solid track-and-fill bar.
 *
 * The pattern was written three times inline before this existed: `HeroBar`
 * in the profile score hero (3px), `ScoreBulletRow` in the performance tab
 * (4px), and the profile redesign's rail and dialog (4/6/9px). Same track,
 * same ramp fill, three sets of magic numbers.
 *
 * `score: null` is a first-class state, not an error: `style`, `quality` and
 * `contentQualityScore` are all nullable on `GET /v1/me/scores`, and a null
 * content score just means the AI pass hasn't run. A null renders the bare
 * track, so a row keeps its height and the column doesn't jump when the
 * score lands.
 */

import { radius } from "@patch-careers/tokens";
import { clampScore, scoreInk } from "../internal/score-scale";
import { TStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";

export type ScoreBarProps = {
  /** 0-100, or null when the score hasn't been computed. */
  score: number | null;
  /** Bar thickness. 9 reads as a headline score, 6 as a nested one, 4 in a rail. */
  height?: number;
  /** Overrides the ramp fill. Only for bars that aren't a score (e.g. progress). */
  color?: string | undefined;
  trackColor?: string;
  accessibilityLabel?: string;
};

/**
 * A score of 1 on a 300px bar is a third of a pixel — it rounds away and reads
 * as zero, which is a different statement than "almost nothing". Give any
 * non-zero score a visible sliver.
 */
const MIN_FILL_PERCENT = 3;

export function ScoreBar({
  score,
  height = 9,
  color,
  trackColor,
  accessibilityLabel,
}: ScoreBarProps) {
  const palette = useEditorialPalette();
  const themeName = useThemeName();

  const safe = score === null ? null : clampScore(score);
  const fillPercent = safe === null || safe === 0 ? 0 : Math.max(safe, MIN_FILL_PERCENT);
  const fill = color ?? (safe === null ? undefined : scoreInk(safe, themeName));

  return (
    <TStack
      width="100%"
      height={height}
      borderRadius={radius.full}
      overflow="hidden"
      backgroundColor={trackColor ?? palette.hairline}
      {...(accessibilityLabel === undefined
        ? { accessible: false }
        : { accessibilityRole: "progressbar", accessibilityLabel })}
    >
      {fillPercent > 0 && fill !== undefined ? (
        <TStack
          height="100%"
          width={`${fillPercent}%`}
          borderRadius={radius.full}
          backgroundColor={fill}
        />
      ) : null}
    </TStack>
  );
}
