/**
 * Data layer for the Profile tab: the current user's profile + the profile
 * field / avatar mutations. Section data lives in `@/features/sections`
 * (useResumeSections) and resume data in `@/features/resumes`.
 */
import {
  type GetV1UsersProfileQueryResponse,
  getV1UsersProfileQueryKey,
  type PatchV1UsersProfileMutationRequest,
  useGetV1ResumesResumeIdQuality,
  useGetV1UsersProfile,
  usePatchV1UsersProfile,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useMasterResumeId } from "@/features/resumes";
import { useFeedback } from "@/hooks/use-feedback";
import { useI18n } from "@/providers/i18n-provider";
import { type PickedImage, uploadProfileImage } from "../lib/upload-profile-image";

// Moved to their feature homes when the section manager became
// resumeId-parameterized; re-exported so existing imports keep working.
export { useMasterResumeId } from "@/features/resumes";
export { useSectionItemMutations } from "@/features/sections";

/** Current user profile (already warmed by the global app header). */
export function useProfile() {
  return useGetV1UsersProfile();
}

/**
 * Minimalist profile-completeness gauge value: the master resume's
 * backend-defined `completenessScore` (0–100). Required-section presence
 * drives it, so a missing high-value section lowers it. `null` until ready.
 */
export function useProfileCompleteness(): { percent: number | null; isLoading: boolean } {
  const { resumeId } = useMasterResumeId();
  const quality = useGetV1ResumesResumeIdQuality(resumeId ?? "", {
    query: { enabled: Boolean(resumeId) },
  });
  return { percent: quality.data?.completenessScore ?? null, isLoading: quality.isLoading };
}

/** Profile field edits + avatar photo change, both invalidating the profile cache. */
export function useProfileMutations(): {
  updateProfile: (data: PatchV1UsersProfileMutationRequest) => Promise<void>;
  updatePhoto: (file: PickedImage) => Promise<void>;
  removePhoto: () => Promise<void>;
  isPending: boolean;
  photoPending: boolean;
} {
  const queryClient = useQueryClient();
  const patch = usePatchV1UsersProfile();
  const feedback = useFeedback();
  const { t } = useI18n();
  const [photoPending, setPhotoPending] = useState(false);

  const key = getV1UsersProfileQueryKey();
  const invalidate = (): Promise<void> => queryClient.invalidateQueries({ queryKey: key });

  // Merge a patch into the cached profile so the UI reflects it instantly;
  // returns the prior snapshot so callers can roll back on failure.
  const applyOptimistic = (
    patchData: Partial<GetV1UsersProfileQueryResponse>,
  ): GetV1UsersProfileQueryResponse | undefined => {
    const previous = queryClient.getQueryData<GetV1UsersProfileQueryResponse>(key);
    if (previous)
      queryClient.setQueryData<GetV1UsersProfileQueryResponse>(key, { ...previous, ...patchData });
    return previous;
  };

  // Both flows optimistically patch the cache, show their own success/error
  // toast (the DRY backbone), roll back on failure, and rethrow so callers
  // can keep an edit sheet open.
  const updateProfile = async (data: PatchV1UsersProfileMutationRequest): Promise<void> => {
    const previous = applyOptimistic(data as Partial<GetV1UsersProfileQueryResponse>);
    try {
      await patch.mutateAsync({ data });
      feedback.success(t("profile.feedback.saved"));
      await invalidate();
    } catch (err) {
      if (previous) queryClient.setQueryData(key, previous);
      feedback.error(err, "profile.feedback.saveFailed");
      throw err;
    }
  };

  const updatePhoto = async (file: PickedImage): Promise<void> => {
    setPhotoPending(true);
    // Show the just-picked image immediately while the upload runs.
    const previous = applyOptimistic({ photoURL: file.uri });
    try {
      const { url } = await uploadProfileImage(file);
      await patch.mutateAsync({ data: { image: url } });
      feedback.success(t("profile.feedback.photoSaved"));
      await invalidate();
    } catch (err) {
      if (previous) queryClient.setQueryData(key, previous);
      feedback.error(err, "profile.feedback.photoFailed");
      throw err;
    } finally {
      setPhotoPending(false);
    }
  };

  // `image: null` clears the avatar; the backend keeps `image`/`photoURL` in
  // sync on the profile path, so the next read shows the initials fallback.
  const removePhoto = async (): Promise<void> => {
    setPhotoPending(true);
    const previous = applyOptimistic({ photoURL: null });
    try {
      await patch.mutateAsync({ data: { image: null } });
      feedback.success(t("profile.feedback.photoRemoved"));
      await invalidate();
    } catch (err) {
      if (previous) queryClient.setQueryData(key, previous);
      feedback.error(err, "profile.feedback.photoFailed");
      throw err;
    } finally {
      setPhotoPending(false);
    }
  };

  return { updateProfile, updatePhoto, removePhoto, isPending: patch.isPending, photoPending };
}
