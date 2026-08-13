/**
 * `<ScorePanel>` — the shared frame for a score surface: an uppercase
 * section label, a `<ScoreRing>` + a details column, and a free body slot.
 * Absorbs the layout both `ResumeQualityPanel` and `MatchBreakdown`
 * hand-rolled, so the ring row + heading styling live in one place.
 *
 * Two header layouts cover the existing surfaces:
 *   - `labelPlacement="header"` — the label sits in its own top row with an
 *     optional `action` on the right (Match Score).
 *   - `labelPlacement="summary"` — the label sits inside the details column
 *     next to the ring, with `action` at the row's far right (Resume Quality).
 *
 * The `action` slot (an Info button, etc.) and the explain sheet stay in the
 * feature layer so this package remains icon- and i18n-free.
 */

import type { ReactNode } from "react";
import { editorialFonts as fonts } from "../editorial/fonts";
import { TStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { Text } from "../primitives/text";
import { ScoreRing } from "./score-ring";

export type ScorePanelProps = {
  label: string;
  score: number;
  grade?: boolean;
  ringSize?: number;
  animate?: boolean;
  onRevealComplete?: () => void;
  /** Where the label sits relative to the ring. Default `"header"`. */
  labelPlacement?: "header" | "summary";
  /** Right-aligned affordance (e.g. an Info button that opens the explain sheet). */
  action?: ReactNode;
  /** Rendered above the ring row (e.g. a rank-up line). */
  above?: ReactNode;
  /** The column beside the ring (sub-scores / mono text). */
  details?: ReactNode;
  /** The panel body below the ring row (issues, gaps, CTAs). */
  children?: ReactNode;
};

function SectionLabel({ text }: { text: string }): ReactNode {
  const palette = useEditorialPalette();
  return (
    <Text
      fontFamily={fonts.sans}
      fontSize={10}
      fontWeight="600"
      letterSpacing={1.8}
      textTransform="uppercase"
      color={palette.muted}
    >
      {text}
    </Text>
  );
}

export function ScorePanel({
  label,
  score,
  grade = false,
  ringSize,
  animate,
  onRevealComplete,
  labelPlacement = "header",
  action,
  above,
  details,
  children,
}: ScorePanelProps) {
  const ring = (
    <ScoreRing
      score={score}
      grade={grade}
      {...(ringSize !== undefined ? { size: ringSize } : {})}
      {...(animate !== undefined ? { animate } : {})}
      {...(onRevealComplete ? { onRevealComplete } : {})}
    />
  );

  if (labelPlacement === "summary") {
    return (
      <TStack flexDirection="column" gap={18}>
        {above}
        <TStack flexDirection="row" alignItems="center" gap={16}>
          {ring}
          <TStack flexDirection="column" flex={1} gap={5}>
            <SectionLabel text={label} />
            {details}
          </TStack>
          {action}
        </TStack>
        {children}
      </TStack>
    );
  }

  return (
    <TStack flexDirection="column" gap={16}>
      <TStack flexDirection="row" alignItems="center" justifyContent="space-between">
        <SectionLabel text={label} />
        {action}
      </TStack>
      {above}
      <TStack flexDirection="row" alignItems="center" gap={16}>
        {ring}
        {details ? (
          <TStack flexDirection="column" flex={1} gap={7}>
            {details}
          </TStack>
        ) : null}
      </TStack>
      {children}
    </TStack>
  );
}
