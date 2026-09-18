import { brandPiecesDark, landingScrollPalette } from "@patch-careers/tokens";
import { type MotionStyle, motion, useTransform } from "framer-motion";
import { useSharedMotionValue } from "../hooks/use-shared-motion-value.web";
import {
  STATISTIC_GREEN,
  STATISTIC_LIME,
  STATISTIC_PAPER,
  statisticWipe,
} from "../lib/statistic-theme";
import { useLandingSequence } from "../model/landing-variants";
import type { StatisticBackdropProps } from "./statistic-backdrop";

const EMPTY: number[] = [];
function useWipe({ offset, heights, height, reduced }: StatisticBackdropProps) {
  const { chapters } = useLandingSequence();
  const position = useSharedMotionValue(offset, 0);
  const sizes = useSharedMotionValue(heights, EMPTY);
  return useTransform(() => statisticWipe(position.get(), sizes.get(), height, reduced, chapters));
}
export function StatisticBackdrop(props: StatisticBackdropProps) {
  const wipe = useWipe(props);
  const d = useTransform(wipe, (value) => value.path);
  return (
    <svg
      aria-hidden="true"
      data-testid="statistic-backdrop"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      // @style-allow inline: the full-viewport SVG backdrop is a web motion layer, not a Tamagui view
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <motion.path d={d} fill={STATISTIC_GREEN} />
    </svg>
  );
}
export function StatisticHeader(props: StatisticBackdropProps) {
  const wipe = useWipe(props);
  const ink = useTransform(wipe, (value) =>
    value.dark ? STATISTIC_PAPER : landingScrollPalette.statisticInk,
  );
  const background = useTransform(wipe, (value) =>
    value.dark ? STATISTIC_GREEN : landingScrollPalette.canvas,
  );
  const button = useTransform(wipe, (value) =>
    value.dark ? STATISTIC_LIME : landingScrollPalette.accent,
  );
  const buttonInk = useTransform(wipe, (value) =>
    value.dark ? STATISTIC_GREEN : brandPiecesDark.plain,
  );
  return (
    <motion.div
      style={
        {
          display: "contents",
          "--landing-nav-ink": ink,
          "--landing-nav-background": background,
          "--landing-nav-button": button,
          "--landing-nav-button-ink": buttonInk,
        } as MotionStyle
      }
    >
      {props.children}
    </motion.div>
  );
}
