/**
 * `useSaveProfileField` — one save for the identity fields, routed by where
 * each one lives (ADR-003 §7): `headline` and `bio` are the master résumé's
 * headline and summary; name, location and phone are the user's. A person
 * without a master résumé yet (onboarding not finished) still lands on the
 * user row, which the profile read falls back to.
 */
import type { PatchV1UsersProfileMutationRequest } from "@patch-careers/api-client";
import { useMasterResumeId, useResumeMutations } from "@/features/resumes";
import type { ProfileFieldKey } from "../lib/profile-fields";
import { useProfileMutations } from "./queries";

export function useSaveProfileField(): {
  saveField: (key: ProfileFieldKey, value: string) => Promise<void>;
  isPending: boolean;
} {
  const { updateProfile, isPending } = useProfileMutations();
  const { resumeId } = useMasterResumeId();
  const { updateProse, isPending: prosePending } = useResumeMutations();

  const saveField = async (key: ProfileFieldKey, value: string): Promise<void> => {
    const trimmed = value.trim();
    if (resumeId && (key === "headline" || key === "bio")) {
      await updateProse(
        resumeId,
        key === "headline" ? { headline: trimmed } : { summary: trimmed },
      );
      return;
    }
    await updateProfile((trimmed ? { [key]: trimmed } : {}) as PatchV1UsersProfileMutationRequest);
  };

  return { saveField, isPending: isPending || prosePending };
}
