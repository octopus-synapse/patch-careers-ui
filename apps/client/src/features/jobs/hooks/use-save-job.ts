/**
 * Optimistic save/unsave toggle for external jobs.
 *
 * The flag flips immediately in every cached list (matched by `externalId`,
 * which both the live and saved shapes carry); on failure the snapshots are
 * restored. Only the saved-list cache is invalidated on settle — its
 * *membership* changed, while the live list already shows the correct flag.
 */

import { deleteV1JobsExternalSavedId, postV1JobsExternalIdSave } from "@patch-careers/api-client";
import { useToast } from "@patch-careers/ui";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { setSavedFlag } from "../lib/helpers";
import type { ExternalJob } from "../types";
import { EXTERNAL_JOBS_BASE, SAVED_JOBS_BASE } from "./queries";

const BASES = [EXTERNAL_JOBS_BASE, SAVED_JOBS_BASE, { url: "/api/v1/jobs/recommended" }] as const;

export function useToggleSaveJob(): {
  toggle: (job: ExternalJob) => void;
  pendingId: string | null;
} {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useI18n();
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
          // Roll back only this vacancy; a concurrent successful save stays intact.
          writeFlag(job.isSaved ? job.savedId : null);
          toast.show({ title: t("jobs.desktop.saveError"), intent: "danger" });
        } finally {
          inFlight.current.delete(job.externalId);
          setPendingId((current) => (current === job.externalId ? null : current));
          void queryClient.invalidateQueries({ queryKey: [SAVED_JOBS_BASE] });
        }
      };
      void run();
    },
    [queryClient, toast, t],
  );

  return { toggle, pendingId };
}
