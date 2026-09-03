/**
 * Per-item create/update/delete for a resume section, committing immediately
 * and refreshing the sections, resume detail, resume list (updatedAt) and CV
 * preview caches. Moved from the Profile feature when the section manager
 * became resumeId-parameterized (master tab + resume detail both use it).
 */
import {
  getV1ExportResumePreviewQueryKey,
  getV1ResumesQueryKey,
  getV1ResumesResumeIdQualityQueryKey,
  getV1ResumesResumeIdQueryKey,
  getV1ResumesResumeIdSectionsQueryKey,
  useDeleteV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId,
  usePatchV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId,
  usePostV1ResumesResumeIdSectionsSectionTypeKeyItems,
  usePostV1ResumesResumeIdSectionsSectionTypeKeyItemsItemIdRewrite,
  usePutV1ResumesResumeIdSectionsSectionTypeKeyItemsItemIdTranslationsLocale,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/providers/i18n-provider";
import type { SectionPersistAction } from "../types";

export type RewriteProposal = {
  locale: string;
  keys: string[];
  current: Record<string, unknown>;
  proposal: Record<string, unknown>;
};

export function useSectionItemMutations(resumeId: string | undefined): {
  persistFor: (sectionTypeKey: string) => (action: SectionPersistAction) => Promise<void>;
  /** What the other language's copy would say after this edit — nothing is written. */
  proposeRewrite: (input: {
    sectionTypeKey: string;
    itemId: string;
    editedLocale: string;
    edited: Record<string, unknown>;
  }) => Promise<RewriteProposal>;
  /** The person's own copy in a derived language: `manual` (written/accepted) or `diverged` (kept on purpose). */
  writeTranslation: (input: {
    sectionTypeKey: string;
    itemId: string;
    locale: string;
    data: Record<string, unknown>;
    origin: "manual" | "diverged";
  }) => Promise<void>;
  isPending: boolean;
} {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const create = usePostV1ResumesResumeIdSectionsSectionTypeKeyItems();
  const update = usePatchV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId();
  const remove = useDeleteV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId();
  const rewrite = usePostV1ResumesResumeIdSectionsSectionTypeKeyItemsItemIdRewrite();
  const putTranslation =
    usePutV1ResumesResumeIdSectionsSectionTypeKeyItemsItemIdTranslationsLocale();

  const invalidate = async (): Promise<void> => {
    if (!resumeId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdSectionsQueryKey(resumeId) }),
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdQueryKey(resumeId) }),
      // List shows updatedAt; no-arg preview key prefix-matches every
      // parameterization (master default + explicit resumeId).
      queryClient.invalidateQueries({ queryKey: getV1ResumesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getV1ExportResumePreviewQueryKey() }),
      // Bullet/content edit → the quality score recomputes server-side
      // (debounced worker); refetch so the panel flips to "calculating".
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdQualityQueryKey(resumeId) }),
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

  const proposeRewrite: ReturnType<typeof useSectionItemMutations>["proposeRewrite"] = async (
    input,
  ) => {
    if (!resumeId) throw new Error(t("sections.errors.noResume"));
    const result = await rewrite.mutateAsync({
      resumeId,
      sectionTypeKey: input.sectionTypeKey,
      itemId: input.itemId,
      data: { locale: input.editedLocale, edited: input.edited },
    });
    return result as RewriteProposal;
  };

  const writeTranslation: ReturnType<typeof useSectionItemMutations>["writeTranslation"] = async (
    input,
  ) => {
    if (!resumeId) throw new Error(t("sections.errors.noResume"));
    await putTranslation.mutateAsync({
      resumeId,
      sectionTypeKey: input.sectionTypeKey,
      itemId: input.itemId,
      locale: input.locale,
      data: { data: input.data, origin: input.origin },
    });
    await invalidate();
  };

  return {
    persistFor,
    proposeRewrite,
    writeTranslation,
    isPending:
      create.isPending ||
      update.isPending ||
      remove.isPending ||
      rewrite.isPending ||
      putTranslation.isPending,
  };
}
