/**
 * Records a self-reported "applied" answer for an external listing.
 *
 * The did-apply state lives on the *saved* row (keyed by `savedId`), so a "yes"
 * for a not-yet-saved listing first saves it (snapshotting the listing), then
 * marks it applied — which is what makes it surface in the Candidaturas scope.
 * A "no" only updates state when the job is already saved; we don't create a
 * snapshot just to store a negative answer.
 */

import {
  postV1JobsExternalIdSave,
  postV1JobsExternalSavedIdDidApply,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { ExternalJob } from "../types";
import { SAVED_JOBS_BASE } from "./queries";

const APPLICATIONS_BASE = { url: "/api/v1/jobs/applications" } as const;

export function useReportApplied(): {
  report: (job: ExternalJob, didApply: boolean) => Promise<void>;
  pending: boolean;
} {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const report = useCallback(
    async (job: ExternalJob, didApply: boolean): Promise<void> => {
      setPending(true);
      try {
        let savedId = job.savedId;
        if (!savedId) {
          // "no" on an unsaved listing has nothing to persist against.
          if (!didApply) return;
          const saved = await postV1JobsExternalIdSave(job.id);
          savedId = saved.savedId;
        }
        await postV1JobsExternalSavedIdDidApply(savedId, { didApply });
        // Refresh the saved list (membership/applied flag) and the
        // Candidaturas scope so the new application shows up.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [SAVED_JOBS_BASE] }),
          queryClient.invalidateQueries({ queryKey: [APPLICATIONS_BASE] }),
        ]);
      } finally {
        setPending(false);
      }
    },
    [queryClient],
  );

  return { report, pending };
}
