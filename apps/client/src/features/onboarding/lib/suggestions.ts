import type { SectionItem } from "../types";

/** Read a string field from a section item's content, tolerating the
 *  several keys the backend/section definitions use for a job title. */
function readField(content: Record<string, unknown> | undefined, keys: string[]): string {
  if (!content) return "";
  for (const key of keys) {
    const value = content[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return "";
}

/** Is this work-experience item the "current" job? Current = no end date
 *  (the `allowPresentFlag` convention) or an explicit `current` flag. */
export function isCurrentJob(item: SectionItem): boolean {
  const content = item.content;
  if (!content) return false;
  if (content.current === true) return true;
  const endDate = content.endDate;
  return endDate === undefined || endDate === null || endDate === "";
}

/**
 * Suggest up to three professional headlines from the work experience, e.g.
 * ["Frontend Engineer @ Vercel", "Frontend Engineer"]. The current job leads;
 * shown as tappable chips on the headline step (never silently pre-filled,
 * so the user stays in control). Empty when there's nothing to suggest.
 */
export function suggestHeadlinesFromExperience(items: readonly SectionItem[]): string[] {
  const current = items.find(isCurrentJob);
  const ordered = current ? [current, ...items.filter((item) => item !== current)] : [...items];
  const suggestions: string[] = [];
  const push = (value: string) => {
    if (value && !suggestions.includes(value) && suggestions.length < 3) suggestions.push(value);
  };
  for (const item of ordered) {
    const role = readField(item.content, ["role", "jobTitle", "title", "position"]);
    const company = readField(item.content, ["company", "employer", "organization"]);
    if (role && company) push(`${role} @ ${company}`);
    push(role);
  }
  return suggestions;
}

// Backend username charset (lowercase letters, digits, underscore).
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

/**
 * Suggest a username handle from a person's name, e.g. "Maria Silva" →
 * "maria_silva". Strips diacritics and anything outside the allowed charset;
 * returns `""` when the result would be too short to be valid.
 */
export function suggestUsernameFromName(name: string): string {
  const handle = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join("_")
    .slice(0, USERNAME_MAX);
  return handle.length >= USERNAME_MIN ? handle : "";
}
