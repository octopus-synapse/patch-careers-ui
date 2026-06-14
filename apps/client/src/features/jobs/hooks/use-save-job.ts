/**
 * Optimistic save/unsave toggle for external jobs.
 *
 * The flag flips immediately in every cached list (matched by `externalId`,
 * which both the live and saved shapes carry); on failure the snapshots are
 * restored. Only the saved-list cache is invalidated on settle — its
 * *membership* changed, while the live list already shows the correct flag.
 */

import { deleteV1JobsExternalSavedId, postV1JobsExternalIdSave } from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import { setSavedFlag } from "../lib/helpers";
import type { ExternalJob } from "../types";
import { EXTERNAL_JOBS_BASE, SAVED_JOBS_BASE } from "./queries";

const BASES = [EXTERNAL_JOBS_BASE, SAVED_JOBS_BASE] as const;

export function useToggleSaveJob(): {
  toggle: (job: ExternalJob) => void;
  pendingId: string | null;
} {
  const queryClient = useQueryClient();
  const inFlight = useRef<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggle = useCallback(
    (job: ExternalJob) => {
      if (inFlight.current.has(job.externalId)) return;
      inFlight.current.add(job.externalId);
      setPendingId(job.externalId);
      void Haptics.selectionAsync();

      const run = async (): Promise<void> => {
        await Promise.all(BASES.map((base) => queryClient.cancelQueries({ queryKey: [base] })));
        const snapshots = BASES.flatMap((base) =>
          queryClient.getQueriesData<unknown>({ queryKey: [base] }),
        );
        const writeFlag = (savedId: string | null): void => {
          for (const base of BASES) {
            queryClient.setQueriesData<unknown>({ queryKey: [base] }, (data: unknown) =>
              setSavedFlag(data, job.externalId, savedId),
            );
          }
        };

        // Optimistic flip; the real savedId is patched in after the POST.
        writeFlag(job.isSaved ? null : "pending");
        try {
          if (job.isSaved) {
            if (job.savedId) await deleteV1JobsExternalSavedId(job.savedId);
          } else {
            const result = await postV1JobsExternalIdSave(job.id);
            writeFlag(result.savedId);
          }
        } catch {
          // Restore every snapshot (covers the 404 "listing swept" race).
          for (const [key, data] of snapshots) queryClient.setQueryData(key, data);
        } finally {
          inFlight.current.delete(job.externalId);
          setPendingId((current) => (current === job.externalId ? null : current));
          void queryClient.invalidateQueries({ queryKey: [SAVED_JOBS_BASE] });
        }
      };
      void run();
    },
    [queryClient],
  );

  return { toggle, pendingId };
}
