/**
 * React-Query glue for the Fit Profile feature.
 *
 * Thin wrappers over the generated SDK hooks: the lifecycle status (`/me`),
 * the idempotent question set, and the answer-submission mutation. On a
 * successful submit we invalidate `/me` so any gated surface (Match, the
 * Recomendadas section) re-reads the now-`responded` status and unlocks.
 */

import {
  getV1FitProfileMeQueryKey,
  useGetV1FitProfileMe,
  useGetV1FitProfileQuestions,
  usePostV1FitProfileAnswers,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";

/** Caller's fit-profile lifecycle state (`never` | `responded` | `expired`). */
export function useFitStatus() {
  return useGetV1FitProfileMe();
}

/** The 25-question set (idempotent per user until completed). */
export function useFitQuestions(enabled = true) {
  return useGetV1FitProfileQuestions({ query: { enabled } });
}

/** Commit all 25 answers; computes + persists the vector. */
export function useSubmitFitAnswers() {
  const queryClient = useQueryClient();
  return usePostV1FitProfileAnswers({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getV1FitProfileMeQueryKey() });
      },
    },
  });
}
