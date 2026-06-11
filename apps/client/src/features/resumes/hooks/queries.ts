/**
 * Data layer for the resumes feature: the user's resume list (master first,
 * slots), per-resume detail, tailored versions, and the rename / delete /
 * duplicate / style mutations behind the Currículos sub-tab and the resume
 * detail screen.
 */
import {
  type DuplicateResumeRequest,
  type GetV1Resumes200,
  getV1ResumesQueryKey,
  getV1ResumesResumeIdQueryKey,
  getV1ResumesSlotsQueryKey,
  useDeleteV1ResumesResumeId,
  useGetV1ResumeStyles,
  useGetV1Resumes,
  useGetV1ResumesResumeId,
  useGetV1ResumesResumeIdTailoredVersions,
  useGetV1ResumesSlots,
  usePatchV1ResumesResumeId,
  usePostV1ResumesResumeIdDuplicate,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";

export type ResumeListItem = GetV1Resumes200["items"][number];

/** Resume list, master first (backend marks it via `isPrimary`). */
export function useResumeList(): {
  resumes: ResumeListItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const query = useGetV1Resumes();
  const items = query.data?.items ?? [];
  const resumes = [...items].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return {
    resumes,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}

/** Remaining resume slots ("2 de 4"). */
export function useResumeSlots(): {
  used: number;
  limit: number;
  remaining: number;
  isLoading: boolean;
} {
  const query = useGetV1ResumesSlots();
  return {
    used: query.data?.used ?? 0,
    limit: query.data?.limit ?? 4,
    remaining: query.data?.remaining ?? 0,
    isLoading: query.isLoading,
  };
}

/** The user's master resume id (`isPrimary` from the backend, first as fallback). */
export function useMasterResumeId(): {
  resumeId: string | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useGetV1Resumes();
  const items = query.data?.items ?? [];
  return {
    resumeId: items.find((item) => item.isPrimary)?.id ?? items[0]?.id,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useResumeDetail(resumeId: string | undefined) {
  return useGetV1ResumesResumeId(resumeId ?? "", { query: { enabled: Boolean(resumeId) } });
}

/** Tailored LLM variants of a resume, grouped under it in the list. */
export function useTailoredVersions(resumeId: string | undefined) {
  const query = useGetV1ResumesResumeIdTailoredVersions(resumeId ?? "", {
    query: { enabled: Boolean(resumeId) },
  });
  return { versions: query.data?.versions ?? [], isLoading: query.isLoading };
}

/** Visual styles (Typst templates) for the create-resume wizard. */
export function useResumeStyles() {
  return useGetV1ResumeStyles();
}

export function useResumeMutations(): {
  renameResume: (resumeId: string, title: string) => Promise<void>;
  deleteResume: (resumeId: string) => Promise<void>;
  duplicateResume: (sourceResumeId: string, data: DuplicateResumeRequest) => Promise<string>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const patch = usePatchV1ResumesResumeId();
  const remove = useDeleteV1ResumesResumeId();
  const duplicate = usePostV1ResumesResumeIdDuplicate();

  const invalidateList = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getV1ResumesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getV1ResumesSlotsQueryKey() }),
    ]);
  };

  const renameResume = async (resumeId: string, title: string): Promise<void> => {
    await patch.mutateAsync({ resumeId, data: { title } });
    await Promise.all([
      invalidateList(),
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdQueryKey(resumeId) }),
    ]);
  };

  const deleteResume = async (resumeId: string): Promise<void> => {
    await remove.mutateAsync({ resumeId });
    await invalidateList();
  };

  const duplicateResume = async (
    sourceResumeId: string,
    data: DuplicateResumeRequest,
  ): Promise<string> => {
    const created = await duplicate.mutateAsync({ resumeId: sourceResumeId, data });
    await invalidateList();
    return created.id;
  };

  return {
    renameResume,
    deleteResume,
    duplicateResume,
    isPending: patch.isPending || remove.isPending || duplicate.isPending,
  };
}
