/**
 * Match feature — public API. The "Recomendadas pra você" section (carousel +
 * blur/lock gate) for the Jobs tab. Import only from "@/features/match".
 */
export { MarketPulseCard } from "./components/market-pulse-card";
export { MatchBreakdown, type MatchBreakdownJob } from "./components/match-breakdown";
export { RecommendedSection } from "./components/recommended-section";
export { useDefaultMatchResume } from "./hooks/use-default-match-resume";
export { useListMatchScores } from "./hooks/use-list-match-scores";
export type { RecommendedJob } from "./types";
