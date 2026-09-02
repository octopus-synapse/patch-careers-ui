/**
 * The profile cover image: where it is now, and how to change it.
 *
 * Same two-step as the avatar — upload the file, then record the URL — except
 * the second step writes to the device instead of the API, because the profile
 * has no cover field yet (see `../model/profile-cover.store`).
 */

import { useState } from "react";
import { useFeedback } from "@/hooks/use-feedback";
import { useI18n } from "@/providers/i18n-provider";
import { type PickedImage, uploadProfileImage } from "../lib/upload-profile-image";
import { useProfileCoverStore } from "../model/profile-cover.store";
import { useProfile } from "./queries";

export function useProfileCover(): {
  coverURL: string | undefined;
  updateCover: (file: PickedImage) => Promise<void>;
  removeCover: () => void;
  coverPending: boolean;
} {
  const { t } = useI18n();
  const feedback = useFeedback();
  const userId = useProfile().data?.id;
  const stored = useProfileCoverStore((store) => (userId ? store.covers[userId] : undefined));
  const setCover = useProfileCoverStore((store) => store.setCover);
  const clearCover = useProfileCoverStore((store) => store.clearCover);
  const [pending, setPending] = useState(false);
  // The just-picked file, shown while the upload runs (the store only ever
  // holds URLs that survived it).
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const updateCover = async (file: PickedImage): Promise<void> => {
    if (!userId) return;
    setPending(true);
    setPreview(file.uri);
    try {
      const { url } = await uploadProfileImage(file);
      setCover(userId, url);
      feedback.success(t("profile.feedback.coverSaved"));
    } catch (err) {
      feedback.error(err, "profile.feedback.coverFailed");
    } finally {
      setPreview(undefined);
      setPending(false);
    }
  };

  const removeCover = (): void => {
    if (!userId) return;
    clearCover(userId);
    feedback.success(t("profile.feedback.coverRemoved"));
  };

  return { coverURL: preview ?? stored, updateCover, removeCover, coverPending: pending };
}
