import type { MotionValue } from "framer-motion";
import { createContext, useContext } from "react";

export interface ChapterMotion {
  readonly travel: MotionValue<number>;
  readonly progress: MotionValue<number>;
  readonly intro: MotionValue<number>;
  readonly reduced: boolean;
  readonly compact: boolean;
  readonly index: number;
}
export const ChapterMotionContext = createContext<ChapterMotion | null>(null);
export function useChapterMotion(): ChapterMotion {
  const context = useContext(ChapterMotionContext);
  if (!context) throw new Error("Chapter motion requires a ChapterSurface.");
  return context;
}
