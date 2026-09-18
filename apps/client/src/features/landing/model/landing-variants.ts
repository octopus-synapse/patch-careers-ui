import { createContext, useContext } from "react";
import type { ChapterKey, ChapterSpec } from "../types";
import { CHAPTERS } from "./chapters";

export type LandingVariant = "b";
const chapter = (key: ChapterKey): ChapterSpec => ({
  ...(CHAPTERS.find((item) => item.key === key) ?? { key, accent: "mint", pose: "sealed" }),
  ...(key === "hero"
    ? { hold: 0.5 }
    : ["vivo", "versions", "vivo2"].includes(key)
      ? { hold: 1.5 }
      : {}),
});
export const LANDING_VARIANTS: Record<LandingVariant, readonly ChapterSpec[]> = {
  b: [
    "hero",
    "dor",
    "vivo",
    "interviews",
    "silence",
    "notas",
    "robo",
    "auto",
    "qualified",
    "cta",
  ].map((key) => chapter(key as ChapterKey)),
};
export const LandingSequenceContext = createContext<{
  chapters: readonly ChapterSpec[];
  variant?: LandingVariant;
}>({ chapters: CHAPTERS });
export const useLandingSequence = () => useContext(LandingSequenceContext);
