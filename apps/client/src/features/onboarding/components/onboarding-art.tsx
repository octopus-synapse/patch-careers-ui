/**
 * Editorial line-art for onboarding empty states and the welcome screen.
 * Thin hairline strokes in `ink/muted` with a single `accent` detail — matches
 * the "Editorial Calm" tone (sober, not a colorful illustration pack).
 */

import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

export interface OnboardingArtProps {
  /** Square-ish art; width drives the box, height ≈ width * 0.8. */
  readonly size?: number;
}

/** A résumé page with an accent check — used on the welcome screen. */
export function WelcomeArt({ size = 132 }: OnboardingArtProps): ReactElement {
  const { subtle: STROKE, accent: ACCENT } = useEditorialPalette();
  const h = Math.round(size * 0.86);
  return (
    <Svg width={size} height={h} viewBox="0 0 132 114" fill="none">
      <Rect x={26} y={10} width={70} height={94} rx={8} stroke={STROKE} strokeWidth={1.5} />
      <Line
        x1={38}
        y1={30}
        x2={84}
        y2={30}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={38}
        y1={44}
        x2={72}
        y2={44}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={38}
        y1={58}
        x2={84}
        y2={58}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={38}
        y1={72}
        x2={66}
        y2={72}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={94} cy={86} r={18} stroke={ACCENT} strokeWidth={1.75} />
      <Path
        d="M86 86l5.5 5.5L103 80"
        stroke={ACCENT}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A briefcase outline — work-experience empty state. */
export function ExperienceArt({ size = 120 }: OnboardingArtProps): ReactElement {
  const { subtle: STROKE, accent: ACCENT } = useEditorialPalette();
  const h = Math.round(size * 0.8);
  return (
    <Svg width={size} height={h} viewBox="0 0 120 96" fill="none">
      <Rect x={18} y={34} width={84} height={50} rx={8} stroke={STROKE} strokeWidth={1.5} />
      <Path
        d="M46 34v-8a6 6 0 016-6h16a6 6 0 016 6v8"
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line x1={18} y1={56} x2={102} y2={56} stroke={STROKE} strokeWidth={1.5} />
      <Rect x={52} y={50} width={16} height={12} rx={3} stroke={ACCENT} strokeWidth={1.75} />
    </Svg>
  );
}

/** A graduation cap outline — education empty state. */
export function EducationArt({ size = 120 }: OnboardingArtProps): ReactElement {
  const { subtle: STROKE, accent: ACCENT } = useEditorialPalette();
  const h = Math.round(size * 0.8);
  return (
    <Svg width={size} height={h} viewBox="0 0 120 96" fill="none">
      <Path
        d="M60 26L98 42 60 58 22 42 60 26z"
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M38 49v16c0 5 10 9 22 9s22-4 22-9V49"
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1={98}
        y1={42}
        x2={98}
        y2={64}
        stroke={ACCENT}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <Circle cx={98} cy={66} r={2.5} fill={ACCENT} />
    </Svg>
  );
}

/** Generic empty-state mark for sections without a bespoke illustration. */
export function GenericSectionArt({ size = 120 }: OnboardingArtProps): ReactElement {
  const { subtle: STROKE, accent: ACCENT } = useEditorialPalette();
  const h = Math.round(size * 0.8);
  return (
    <Svg width={size} height={h} viewBox="0 0 120 96" fill="none">
      <Rect x={26} y={20} width={68} height={56} rx={10} stroke={STROKE} strokeWidth={1.5} />
      <Line
        x1={40}
        y1={40}
        x2={80}
        y2={40}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={40}
        y1={54}
        x2={66}
        y2={54}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={86} cy={66} r={12} stroke={ACCENT} strokeWidth={1.75} />
      <Path d="M86 61v10M81 66h10" stroke={ACCENT} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

/** Pick the illustration for a section by its backend `sectionTypeKey`. */
export function sectionArtFor(
  sectionTypeKey: string | undefined,
): (props: OnboardingArtProps) => ReactElement {
  if (sectionTypeKey === "work_experience_v1") return ExperienceArt;
  if (sectionTypeKey === "education_v1") return EducationArt;
  return GenericSectionArt;
}
