/**
 * Shared "section editor" toolkit — the editorial multi-item editor (work
 * experience, education, …) plus the field controls, primitives and styles it
 * is built from. Consumed by both the onboarding wizard and the Profile tab.
 */
export { AddSectionFlowModal } from "./components/add-section-flow-modal";
export { FieldRenderer } from "./components/field-renderer";
export {
  AddRow,
  FieldLabel,
  FieldShell,
  GhostButton,
  OptionPill,
  OverlayModal,
} from "./components/primitives";
export {
  ResumeSectionsManager,
  type ResumeSectionsManagerProps,
  type SectionsManagerHandle,
} from "./components/resume-sections-manager";
export { RolePicker, type RolePickerProps } from "./components/role-picker";
export { SectionCard } from "./components/section-card";
export { SectionCatalogList } from "./components/section-catalog-list";
export { SectionDetailRow } from "./components/section-detail-row";
export { SectionForm } from "./components/section-form";
export { SectionItemEditor } from "./components/section-item-editor";
export { SectionPanelCard } from "./components/section-panel-card";
export {
  type ResumeSections,
  type SectionGroupInfo,
  type SectionLocales,
  useResumeSections,
} from "./hooks/use-resume-sections";
export { useSectionItemMutations } from "./hooks/use-section-item-mutations";
export { itemCardParts, itemSummary, monthLabel, parseYearMonth } from "./lib/helpers";
export { type ItemDetail, itemDetail } from "./lib/item-detail";
export { fieldsFromDefinition } from "./lib/section-definition";
export type { MergedSection } from "./lib/section-visibility";
export { eyebrow, useEd, webNoOutline } from "./lib/styles";
export { validateSectionFields } from "./lib/validation";
export type {
  FormData,
  SectionDescriptor,
  SectionField,
  SectionItem,
  SectionPersistAction,
} from "./types";
