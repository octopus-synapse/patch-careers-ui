import { motion, useTransform } from "framer-motion";
import { type ReactElement, useMemo } from "react";
import { ChapterMotionContext } from "../hooks/use-chapter-motion.web";
import { useLandingMotionContext } from "../hooks/use-landing-motion";
import { useSharedMotionValue } from "../hooks/use-shared-motion-value.web";
import { chapterTravel } from "../lib/parallax-math";
import { useChapterReveal } from "./chapter-frame";
import type { ChapterSurfaceProps } from "./chapter-surface";

const EMPTY_HEIGHTS: number[] = [];

/** One scroll subscription per chapter feeds all of its Motion layers. */
export function ChapterSurface({ children, active }: ChapterSurfaceProps): ReactElement {
  const frame = useChapterReveal();
  const landing = useLandingMotionContext();
  const index = frame?.index ?? 0;
  const compact = frame?.narrow ?? true;
  const reduced = landing?.reduced ?? true;
  const offset = useSharedMotionValue(frame?.offset, 0);
  const heights = useSharedMotionValue(frame?.heights, EMPTY_HEIGHTS);
  const focus = useSharedMotionValue(frame?.focus, index + 1);
  const opening = useSharedMotionValue(landing?.intro, 0);
  const travel = useTransform(() =>
    reduced ? 0 : chapterTravel(offset.get(), heights.get(), index, frame?.viewport ?? 1),
  );
  const progress = useTransform(() => {
    if (reduced) return 1;
    if (compact) {
      const sizes = heights.get();
      const start = sizes.slice(0, index).reduce((sum, height) => sum + height, 0);
      const overflow = (sizes[index] ?? 0) - (frame?.viewport ?? 1);
      return overflow > 24 ? Math.max(0, Math.min(1, (offset.get() - start) / overflow)) : 1;
    }
    return Math.max(0, Math.min(1, focus.get() - index));
  });
  const intro = useTransform(() => (reduced || index !== 0 ? 0 : opening.get()));
  const opacity = useTransform(travel, [-1.25, -0.35, 0, 0.35, 1.25], [0.5, 1, 1, 1, 0.5]);
  const scale = useTransform(() => 1 - Math.min(1, Math.abs(travel.get())) * (compact ? 0 : 0.018));
  const context = useMemo(
    () => ({ travel, progress, intro, reduced, compact, index }),
    [travel, progress, intro, reduced, compact, index],
  );
  return (
    <ChapterMotionContext.Provider value={context}>
      <motion.div
        inert={!active}
        aria-hidden={!active}
        data-testid={`landing-cinema-surface-${index}`}
        style={{ opacity, scale, transformOrigin: "50% 50%" }}
      >
        {children}
      </motion.div>
    </ChapterMotionContext.Provider>
  );
}
