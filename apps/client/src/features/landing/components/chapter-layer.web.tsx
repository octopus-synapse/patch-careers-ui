import { motion, useTransform } from "framer-motion";
import type { ReactElement } from "react";
import { useChapterMotion } from "../hooks/use-chapter-motion.web";
import type { ChapterLayerProps } from "./chapter-frame";

/** Copy follows the title; cards settle last, with no sideways text drift. */
export function ChapterLayer({ depth = 1, order = 0, children }: ChapterLayerProps): ReactElement {
  const { travel, intro, compact, index } = useChapterMotion();
  const distance = [18, 30, 46][depth] ?? 30;
  const y = useTransform(
    () => (travel.get() * -(distance + order * 7) + intro.get() * distance) * (compact ? 0.5 : 1),
  );
  const opacity = useTransform(() => {
    const exit = Math.max(0, Math.abs(travel.get()) - 0.25) / 0.95;
    const opening = depth === 0 ? 0 : intro.get() * 0.65;
    return 1 - Math.min(1, Math.max(exit * 0.65, opening));
  });
  return (
    <motion.div data-testid={`landing-layer-${index}-${depth}-${order}`} style={{ y, opacity }}>
      {children}
    </motion.div>
  );
}
