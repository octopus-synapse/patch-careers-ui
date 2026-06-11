/**
 * Data layer for the Profile tab. Wraps the generated query/mutation hooks into
 * task-shaped helpers: derive editable experience / education sections and
 * commit profile edits with cache invalidation so the screen (and the CV
 * preview) reflect changes immediately.
 */
import {
  getV1UsersProfileQueryKey,
  type PatchV1UsersProfileMutationRequest,
  useGetV1ResumesResumeIdSections,
  useGetV1UsersProfile,
  usePatchV1UsersProfile,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  fieldsFromDefinition,
  type SectionDescriptor,
  type SectionItem,
} from "@/features/sections";
import { type PickedImage, uploadProfileImage } from "../lib/upload-profile-image";

// Moved to their feature homes when the section manager became
// resumeId-parameterized; re-exported so existing imports keep working.
export { useMasterResumeId } from "@/features/resumes";
export { useSectionItemMutations } from "@/features/sections";

export const WORK_EXPERIENCE_KEY = "work_experience_v1";
export const EDUCATION_KEY = "education_v1";

/** Current user profile (already warmed by the global app header). */
export function useProfile() {
  return useGetV1UsersProfile();
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
