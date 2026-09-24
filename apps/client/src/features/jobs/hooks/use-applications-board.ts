import { useMemo } from "react";
import type { Opportunity, PreparationStage, WorkspaceEntry } from "../lib/discovery";
import { EMPTY_JOBS_FILTERS } from "../types";
import { useExternalJobs } from "./queries";
import { useApplications, useApplicationTimeline } from "./use-applications";

export type ApplicationBoardRow = {
  key: string;
  job: Opportunity | null;
  title: string;
  company: string;
  stage: PreparationStage;
  documentCount: number;
  id: string;
  closed: boolean;
};

export function useApplicationsBoard(entries: WorkspaceEntry[], workspaceLoading: boolean) {
  const applications = useApplications(true);
  const saved = useExternalJobs(EMPTY_JOBS_FILTERS, "saved");
  const tracker = useApplicationTimeline();
  const rows = useMemo<ApplicationBoardRow[]>(() => {
    const merged: ApplicationBoardRow[] = entries
      .filter((entry) => entry.stage !== null)
      .map((entry) => ({
        key: entry.job.externalId,
        job: entry.job,
        title: entry.job.title,
        company: entry.job.company,
        stage: entry.stage as PreparationStage,
        documentCount: entry.documents.length,
        id: entry.job.id,
        closed: false,
      }));
    for (const application of applications.sections.flatMap((section) => section.data)) {
      const job =
        saved.jobs.find(
          (candidate) =>
            candidate.id === application.jobRouteId || candidate.savedId === application.jobRouteId,
        ) ?? application.job;
      const timeline = tracker.data?.applications.find(
        (item) => `internal-${item.id}` === application.id,
      );
      const interview = timeline?.events.some((event) =>
        ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER_RECEIVED"].includes(event.type),
      );
      const existing = merged.find((row) => job && row.key === job.externalId);
      if (existing) {
        existing.closed = application.status === "closed";
        continue;
      }
      merged.push({
        key: application.id,
        job: job ?? null,
        title: application.title,
        company: application.company,
        stage: interview ? "interview" : "sent",
        documentCount: 0,
        id: job?.id ?? "",
        closed: application.status === "closed",
      });
    }
    return merged;
  }, [applications.sections, saved.jobs, tracker.data, entries]);
  return {
    rows,
    isLoading: applications.isLoading || workspaceLoading,
    isError: applications.isError,
    refetch: applications.refetch,
  };
}
