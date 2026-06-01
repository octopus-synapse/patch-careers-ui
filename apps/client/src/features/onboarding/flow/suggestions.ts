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
 * Suggest a professional headline from the current work experience, e.g.
 * "Frontend Engineer @ Vercel". Returns `""` when there's nothing to
 * suggest — the headline step then starts blank.
 */
export function suggestHeadlineFromExperience(items: readonly SectionItem[]): string {
  const current = items.find(isCurrentJob) ?? items[0];
  if (!current) return "";
  const role = readField(current.content, ["role", "jobTitle", "title", "position"]);
  const company = readField(current.content, ["company", "employer", "organization"]);
  if (role && company) return `${role} @ ${company}`;
  return role || "";
}
