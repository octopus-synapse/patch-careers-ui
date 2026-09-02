/**
 * Profile cover — the banner behind the identity header.
 *
 * The backend profile has no cover field yet (`GET /v1/users/profile` returns
 * `photoURL` and nothing else image-shaped), so the chosen image is uploaded
 * through the existing profile-image endpoint — that part is durable and
 * server-side — and only the *choice* is kept here, on the device, keyed by
 * user id so a second account on the same device does not inherit it.
 *
 * When the backend grows a `coverURL`, this store is the only thing that has
 * to go: the header already reads the URL through `useProfileCover`.
 */

import { createPersistedStore } from "@patch-careers/state";
import { mundane } from "@patch-careers/storage";

export const PROFILE_COVER_STORE_KEY = "patch-careers:profile-cover";
export const PROFILE_COVER_STORE_VERSION = 1;

interface ProfileCoverData {
  /** userId → cover image URL. */
  covers: Record<string, string>;
}
interface ProfileCoverActions {
  setCover: (userId: string, url: string) => void;
  clearCover: (userId: string) => void;
}

export const useProfileCoverStore = createPersistedStore<ProfileCoverData, ProfileCoverActions>({
  key: PROFILE_COVER_STORE_KEY,
  version: PROFILE_COVER_STORE_VERSION,
  storage: mundane,
  initialData: { covers: {} },
  createActions: (set, get) => ({
    setCover: (userId, url) => set({ covers: { ...get().covers, [userId]: url } }),
    clearCover: (userId) => {
      const { [userId]: _removed, ...rest } = get().covers;
      set({ covers: rest });
    },
  }),
  validate: (persisted) => {
    if (persisted === null || typeof persisted !== "object") return null;
    const covers = (persisted as { covers?: unknown }).covers;
    if (covers === null || typeof covers !== "object") return null;
    const clean: Record<string, string> = {};
    for (const [userId, url] of Object.entries(covers as Record<string, unknown>)) {
      if (typeof url === "string" && url.length > 0) clean[userId] = url;
    }
    return { covers: clean };
  },
});
