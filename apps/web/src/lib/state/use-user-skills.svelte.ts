import { getV1UsersMeSkills } from 'api-client';
import { browser } from '$app/environment';

/**
 * Fetches the current user's skills once on the client and exposes them
 * as a lowercase Set for O(1) overlap checks. Returns an empty set until
 * the fetch resolves, or on any failure — callers should treat absence as
 * "no fit score available" rather than an error.
 */
export function useUserSkills() {
  let skills = $state<Set<string>>(new Set());

  $effect(() => {
    if (!browser) return;
    getV1UsersMeSkills()
      .then((res) => {
        skills = new Set(res.items.map((s) => s.skill.toLowerCase()));
      })
      .catch(() => {});
  });

  return {
    get skills() {
      return skills;
    },
  };
}
