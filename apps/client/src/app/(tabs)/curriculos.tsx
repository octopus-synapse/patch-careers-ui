import { useAppRouter } from "@/navigation/use-app-router";
import { useQueryClient } from "@tanstack/react-query";

import type { ReactElement } from "react";
import { seedExternalJob } from "@/features/jobs";
import { ResumesScreen } from "@/features/resumes";

export default function CurriculosTab(): ReactElement {
  const queryClient = useQueryClient();
  const router = useAppRouter();
  return (
    <ResumesScreen
      onOpenJob={(job) => {
        // The detail screen resolves external jobs from the list cache;
        // seed this recommended item so the deep link isn't a cold miss.
        seedExternalJob(queryClient, job);
        router.push({ pathname: "/job/[id]", params: { id: job.id } });
      }}
    />
  );
}
