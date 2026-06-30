import type { GetV1FitProfileMe200, GetV1FitProfileQuestions200 } from "@patch-careers/api-client";

/** A single question as returned by `GET /v1/fit-profile/questions`. */
export type FitQuestion = GetV1FitProfileQuestions200["questions"][number];

/** Scale type of a fit question (mirrors the backend `FitScaleType`). */
export type FitScaleType = FitQuestion["scaleType"];

/** Lifecycle status of the caller's fit profile. */
export type FitProfileStatus = GetV1FitProfileMe200["status"];

/**
 * Draft answers keyed by `questionId` → `rawValue`.
 * - likert5 → 1..5
 * - binary  → 0 | 1
 */
export type FitAnswerDraft = Record<string, number>;
