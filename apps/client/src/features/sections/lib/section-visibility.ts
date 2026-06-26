/**
 * Pure merge of the backend's section-type catalog with a resume's existing
 * sections, encoding the Profile redesign's visibility rules:
 *
 *   - the VIEW shows only sections with at least one item — this applies to
 *     mandatory section types too (no "ainda não tenho" placeholder anymore);
 *   - `isMandatory` survives only as an ordering/hint signal for the catalog;
 *   - order follows the catalog (no user reordering, by design).
 *
 * The full catalog is also returned for the single "add" entry point, with a
 * per-type capacity flag so non-repeatable / capped types disable in the picker.
 */
import type { SectionDescriptor, SectionItem } from "../types";
import { fieldsFromDefinition } from "./section-definition";

/** The slice of `GET /v1/resumes/:id/sections/types` items this module reads. */
export type CatalogSectionType = {
  key: string;
  title: string;
  description: string;
  addLabel: string;
  noDataLabel: string;
  icon: string;
  iconType: string;
  isMandatory: boolean;
  isRepeatable: boolean;
  maxItems: number | null;
  /** Supersection grouping (SectionGroup.key); null/undefined = standalone. */
  groupKey?: string | null;
  definition?: unknown;
};

/** The slice of `GET /v1/resumes/:id/sections` items this module reads. */
export type ResumeSectionLike = {
  id: string;
  sectionTypeKey: string | undefined;
  items: SectionItem[];
};

export type MergedSection = {
  key: string;
  title: string;
  description: string;
  icon: string;
  iconType: string;
  isMandatory: boolean;
  groupKey: string | null;
  addLabel: string;
  noDataLabel: string;
  /** Undefined when the section row doesn't exist yet (mandatory + empty). */
  sectionId: string | undefined;
  items: SectionItem[];
  descriptor: SectionDescriptor;
  /** True when maxItems (or non-repeatable = 1) is reached — picker disables it. */
  atCapacity: boolean;
};

function toMerged(type: CatalogSectionType, section: ResumeSectionLike | undefined): MergedSection {
  const items = section?.items ?? [];
  const cap = type.maxItems ?? (type.isRepeatable ? null : 1);
  return {
    key: type.key,
    title: type.title,
    description: type.description,
    icon: type.icon,
    iconType: type.iconType,
    isMandatory: type.isMandatory,
    groupKey: type.groupKey ?? null,
    addLabel: type.addLabel,
    noDataLabel: type.noDataLabel,
    sectionId: section?.id,
    items,
    descriptor: {
      fields: fieldsFromDefinition(type.definition),
      sectionTypeKey: type.key,
      addLabel: type.addLabel,
      noDataLabel: type.noDataLabel,
    },
    atCapacity: cap !== null && items.length >= cap,
  };
}

export function mergeSectionsWithCatalog(
  catalog: CatalogSectionType[],
  sections: ResumeSectionLike[],
): { visible: MergedSection[]; catalog: MergedSection[] } {
  const byKey = new Map(sections.map((section) => [section.sectionTypeKey, section]));
  const merged = catalog.map((type) => toMerged(type, byKey.get(type.key)));
  return {
    visible: merged.filter((section) => section.items.length > 0),
    catalog: merged,
  };
}
