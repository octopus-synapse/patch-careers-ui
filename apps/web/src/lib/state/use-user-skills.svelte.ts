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
    fetch('/api/v1/skills', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: unknown) => {
        if (!body) return;
        const list = normalize(body);
        skills = new Set(list.map((s) => s.toLowerCase()));
      })
      .catch(() => {});
  });

  return {
    get skills() {
      return skills;
    },
  };
}

function normalize(body: unknown): string[] {
  const arr = Array.isArray(body)
    ? body
    : Array.isArray((body as { skills?: unknown }).skills)
      ? (body as { skills: unknown[] }).skills
      : Array.isArray((body as { data?: unknown }).data)
        ? (body as { data: unknown[] }).data
        : [];
  return arr
    .map((s) => {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>;
        return (o.name ?? o.skillName ?? o.skill ?? '') as string;
      }
      return '';
    })
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
}
