import {
  getV1ExportResumePdf,
  getV1ResumesQueryKey,
  getV1ResumesResumeIdTailoredVersionsQueryKey,
  type PostV1ResumesResumeIdTailor200,
  postV1JobsImportFromUrl,
  postV1ResumesResumeIdTailor,
} from "@patch-careers/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMasterResumeId } from "@/features/resumes";
import { useI18n } from "@/providers/i18n-provider";
import {
  classifyJobInput,
  type Opportunity,
  type PreparationDocument,
  safeJobUrl,
} from "../lib/discovery";

export function useJobPreparation() {
  const { t } = useI18n();
  const master = useMasterResumeId({ requirePrimary: true });
  const client = useQueryClient();
  const importJob = useMutation({
    mutationFn: async (input: string): Promise<Opportunity> => {
      const kind = classifyJobInput(input);
      if (kind === "invalid-url" || kind === "short")
        throw new Error(
          t(kind === "short" ? "jobs.desktop.invalidDescription" : "jobs.desktop.invalidLink"),
        );
      const url =
        kind === "url"
          ? safeJobUrl(input.trim().startsWith("www.") ? `https://${input.trim()}` : input.trim())
          : null;
      const imported = url
        ? await client.fetchQuery({
            queryKey: ["jobs-import-preview", url],
            queryFn: () => postV1JobsImportFromUrl({ url }),
            staleTime: 30 * 60_000,
            retry: false,
          })
        : null;
      if (
        imported &&
        (!imported.preview.description || imported.preview.description.trim().length < 50)
      )
        throw new Error(t("jobs.desktop.importNoDescription"));
      const preview = imported?.preview;
      const id = `import-${crypto.randomUUID()}`;
      return {
        id,
        externalId: id,
        source: "imported",
        title:
          preview?.title ??
          (!url ? input.trim().split("\n")[0]?.slice(0, 120) : null) ??
          t("jobs.desktop.importedJob"),
        company: preview?.company ?? t("jobs.desktop.unknownCompany"),
        location: preview?.location ?? null,
        isRemote: preview?.remotePolicy === "REMOTE",
        workMode: preview?.remotePolicy ?? "ONSITE",
        workModeKnown: Boolean(preview?.remotePolicy),
        employmentType: preview?.jobType ?? null,
        description: preview?.description ?? input.trim(),
        applyUrl: safeJobUrl(preview?.applyUrl) ?? url ?? "",
        publisher: null,
        postedAt: null,
        fetchedAt: new Date().toISOString(),
        isSaved: false,
        savedId: null,
      };
    },
  });
  const generate = useMutation({
    mutationFn: async ({
      job,
      context = "",
    }: {
      job: Opportunity;
      context?: string;
    }): Promise<PostV1ResumesResumeIdTailor200> => {
      if (!master.resumeId) throw new Error(t("jobs.desktop.noMaster"));
      const result = await client.fetchQuery({
        queryKey: [
          "job-preparation",
          master.resumeId,
          master.updatedAt,
          job.externalId,
          context.trim(),
        ],
        queryFn: () =>
          postV1ResumesResumeIdTailor(master.resumeId ?? "", {
            ...(job.source === "imported" || job.id === job.savedId
              ? {
                  jobDescription: job.description ?? "",
                  jobTitle: job.title.slice(0, 200),
                  jobCompany: job.company.slice(0, 200),
                }
              : { jobId: job.id }),
            ...(context.trim() ? { candidateContext: context.trim() } : {}),
          }),
        staleTime: Infinity,
        gcTime: 60 * 60_000,
        retry: false,
      });
      await Promise.all([
        client.invalidateQueries({
          queryKey: getV1ResumesResumeIdTailoredVersionsQueryKey(master.resumeId),
        }),
        client.invalidateQueries({ queryKey: getV1ResumesQueryKey() }),
      ]);
      return result;
    },
  });
  const exportPdf = useMutation({
    mutationFn: (document: PreparationDocument) =>
      getV1ExportResumePdf({ resumeId: document.resumeId, versionId: document.versionId }),
  });
  return { master, importJob, generate, exportPdf };
}

export function documentsFromPreparation(
  result: PostV1ResumesResumeIdTailor200,
  resumeId: string,
): PreparationDocument[] {
  const common = {
    resumeId,
    versionId: result.versionId,
    label: result.label,
    createdAt: new Date().toISOString(),
  };
  const resume: PreparationDocument = {
    ...common,
    kind: "resume",
    text: [result.jobTitle, result.summary, ...result.bullets.map((bullet) => bullet.tailored)]
      .filter(Boolean)
      .join("\n\n"),
  };
  return [
    resume,
    ...(result.coverLetter
      ? [{ ...common, kind: "letter" as const, text: result.coverLetter }]
      : []),
  ];
}
