/**
 * Data layer for the Profile tab: the current user's profile + the profile
 * field / avatar mutations. Section data lives in `@/features/sections`
 * (useResumeSections) and resume data in `@/features/resumes`.
 */
import {
  getV1UsersProfileQueryKey,
  type PatchV1UsersProfileMutationRequest,
  useGetV1UsersProfile,
  usePatchV1UsersProfile,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { type PickedImage, uploadProfileImage } from "../lib/upload-profile-image";

// Moved to their feature homes when the section manager became
// resumeId-parameterized; re-exported so existing imports keep working.
export { useMasterResumeId } from "@/features/resumes";
export { useSectionItemMutations } from "@/features/sections";

/** Current user profile (already warmed by the global app header). */
export function useProfile() {
  return useGetV1UsersProfile();
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
