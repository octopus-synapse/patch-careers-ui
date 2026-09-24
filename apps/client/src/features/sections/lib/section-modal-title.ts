const BARE_SECTION_MODAL_TITLES = new Set(["work_experience_v1", "education_v1"]);

/** Add/edit context already comes from the modal itself; avoid repeating it in
 * the title of the two long-form section editors. */
export function sectionModalTitle(sectionTypeKey: string, title: string): string {
  if (!BARE_SECTION_MODAL_TITLES.has(sectionTypeKey)) return title;
  const bareTitle = title.replace(/^(?:add|adicionar)\s+/i, "");
  return `${bareTitle.charAt(0).toUpperCase()}${bareTitle.slice(1)}`;
}
