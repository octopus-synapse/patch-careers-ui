/**
 * Fit Profile feature — public API. The 25-question questionnaire screen plus
 * the lifecycle-status hook the match gate reads to decide blur/lock.
 * Import only from "@/features/fit".
 */
export { FitQuestionnaireScreen } from "./components/fit-questionnaire-screen";
export { useFitStatus } from "./hooks/queries";
export type { FitProfileStatus } from "./types";
