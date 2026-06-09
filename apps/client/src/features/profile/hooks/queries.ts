/**
 * Data layer for the Profile tab. Wraps the generated query/mutation hooks into
 * task-shaped helpers: resolve the master resume, derive editable experience /
 * education sections, and commit profile + section-item edits with cache
 * invalidation so the screen (and the CV preview) reflect changes immediately.
 */
import {
  getV1ExportResumePreviewQueryKey,
  getV1ResumesResumeIdQueryKey,
  getV1ResumesResumeIdSectionsQueryKey,
  getV1UsersProfileQueryKey,
  type PatchV1UsersProfileMutationRequest,
  useDeleteV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId,
  useGetV1Resumes,
  useGetV1ResumesResumeIdSections,
  useGetV1UsersProfile,
  usePatchV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId,
  usePatchV1UsersProfile,
  usePostV1ResumesResumeIdSectionsSectionTypeKeyItems,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";
import type { SectionDescriptor, SectionItem, SectionPersistAction } from "@/features/sections";
import { fieldsFromDefinition } from "../lib/section-definition";
import { type PickedImage, uploadProfileImage } from "../lib/upload-profile-image";

export const WORK_EXPERIENCE_KEY = "work_experience_v1";
export const EDUCATION_KEY = "education_v1";

/** Current user profile (already warmed by the global app header). */
export function useProfile() {
  return useGetV1UsersProfile();
}

/**
 * The user's master resume id. There's no "primary" flag, so the first resume
 * is the master (same convention the Resume tab uses).
 */
export function useMasterResumeId(): {
  resumeId: string | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useGetV1Resumes();
  return {
    resumeId: query.data?.items?.[0]?.id,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export type ProfileSection = {
  sectionId: string | undefined;
  sectionTypeKey: string;
  descriptor: SectionDescriptor;
  items: SectionItem[];
};

export type ProfileSections = {
  experience: ProfileSection;
  education: ProfileSection;
  isLoading: boolean;
  isError: boolean;
};

/** Experience + education sourced (read+write) from the master resume's sections. */
export function useProfileSections(resumeId: string | undefined): ProfileSections {
  const query = useGetV1ResumesResumeIdSections(resumeId ?? "", {
    query: { enabled: Boolean(resumeId) },
  });
  const sections = query.data?.sections ?? [];

  const build = (sectionTypeKey: string): ProfileSection => {
    const section = sections.find((s) => s.sectionType?.key === sectionTypeKey);
    return {
      sectionId: section?.id,
      sectionTypeKey,
      descriptor: {
        fields: section ? fieldsFromDefinition(section.sectionType?.definition) : [],
        sectionTypeKey,
      },
      items: (section?.items ?? []).map((item) => ({
        id: item.id,
        content: item.content ?? {},
      })),
    };
  };

  return {
    experience: build(WORK_EXPERIENCE_KEY),
    education: build(EDUCATION_KEY),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Per-item create/update/delete for a resume section, committing immediately and
 * refreshing the sections, resume detail and CV preview caches.
 */
export function useSectionItemMutations(resumeId: string | undefined): {
  persistFor: (sectionTypeKey: string) => (action: SectionPersistAction) => Promise<void>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const create = usePostV1ResumesResumeIdSectionsSectionTypeKeyItems();
  const update = usePatchV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId();
  const remove = useDeleteV1ResumesResumeIdSectionsSectionTypeKeyItemsItemId();

  const invalidate = async (): Promise<void> => {
    if (!resumeId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdSectionsQueryKey(resumeId) }),
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdQueryKey(resumeId) }),
      queryClient.invalidateQueries({ queryKey: getV1ExportResumePreviewQueryKey() }),
    ]);
  };

  const persistFor = (sectionTypeKey: string) => async (action: SectionPersistAction) => {
    if (!resumeId) throw new Error("Sem currículo para editar");
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

/** Profile field edits + avatar photo change, both invalidating the profile cache. */
export function useProfileMutations(): {
  updateProfile: (data: PatchV1UsersProfileMutationRequest) => Promise<void>;
  updatePhoto: (file: PickedImage) => Promise<void>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const patch = usePatchV1UsersProfile();

  const invalidate = (): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: getV1UsersProfileQueryKey() });

  const updateProfile = async (data: PatchV1UsersProfileMutationRequest): Promise<void> => {
    await patch.mutateAsync({ data });
    await invalidate();
  };

  const updatePhoto = async (file: PickedImage): Promise<void> => {
    const { url } = await uploadProfileImage(file);
    await patch.mutateAsync({ data: { image: url } });
    await invalidate();
  };

  return { updateProfile, updatePhoto, isPending: patch.isPending };
}
