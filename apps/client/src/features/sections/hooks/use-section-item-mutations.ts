/**
 * Per-item create/update/delete for a resume section, committing immediately
 * and refreshing the sections, resume detail, resume list (updatedAt) and CV
 * preview caches. Moved from the Profile feature when the section manager
 * became resumeId-parameterized (master tab + resume detail both use it).
 */
import {
  getV1ExportResumePreviewQueryKey,
  getV1ResumesQueryKey,
  getV1ResumesResumeIdQueryKey,
  getV1ResumesResumeIdSectionsQueryKey,
  useDeleteV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId,
  usePatchV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId,
  usePostV1ResumesResumeIdSectionsSectionTypeKeyItems,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/providers/i18n-provider";
import type { SectionPersistAction } from "../types";

export function useSectionItemMutations(resumeId: string | undefined): {
  persistFor: (sectionTypeKey: string) => (action: SectionPersistAction) => Promise<void>;
  isPending: boolean;
} {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const create = usePostV1ResumesResumeIdSectionsSectionTypeKeyItems();
  const update = usePatchV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId();
  const remove = useDeleteV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId();

  const invalidate = async (): Promise<void> => {
    if (!resumeId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdSectionsQueryKey(resumeId) }),
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdQueryKey(resumeId) }),
      // List shows updatedAt; no-arg preview key prefix-matches every
      // parameterization (master default + explicit resumeId).
      queryClient.invalidateQueries({ queryKey: getV1ResumesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getV1ExportResumePreviewQueryKey() }),
    ]);
  };

  const persistFor = (sectionTypeKey: string) => async (action: SectionPersistAction) => {
    if (!resumeId) throw new Error(t("sections.errors.noResume"));
    const content = action.item.content ?? {};
    if (action.kind === "create") {
      await create.mutateAsync({ resumeId, sectionTypeKey, data: { content } });
    } else if (action.kind === "update") {
      if (!action.item.id) throw new Error("Item sem id");
      await update.mutateAsync({
        resumeId,
        sectionTypeKey,
        itemId: action.item.id,
        data: { content },
      });
    } else {
      if (!action.item.id) throw new Error("Item sem id");
      await remove.mutateAsync({ resumeId, sectionTypeKey, itemId: action.item.id });
    }
    await invalidate();
  };

  return {
    persistFor,
    isPending: create.isPending || update.isPending || remove.isPending,
  };
}
