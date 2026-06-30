/**
 * Re-export of the shared editorial `<ScoreRing>` from `@patch-careers/ui`.
 * The implementation now lives in the design system (unified ramp + animated
 * arc/count-up); this module stays so existing feature imports keep working.
 */
export { ScoreRing, type ScoreRingProps } from "@patch-careers/ui";
