/**
 * Shared "section editor" toolkit — the editorial multi-item editor (work
 * experience, education, …) plus the field controls, primitives and styles it
 * is built from. Consumed by both the onboarding wizard and the Profile tab.
 */
export { FieldRenderer } from "./components/field-renderer";
export {
  AddRow,
  FieldLabel,
  FieldShell,
  GhostButton,
  OptionPill,
  OverlayModal,
} from "./components/primitives";
export { SectionForm } from "./components/section-form";
export { SectionItemEditor } from "./components/section-item-editor";
export { itemCardParts, itemSummary, monthLabel, parseYearMonth } from "./lib/helpers";
export { ed, eyebrow, webNoOutline } from "./lib/styles";
export { validateSectionFields } from "./lib/validation";
export type {
  FormData,
  SectionDescriptor,
  SectionField,
  SectionItem,
  SectionPersistAction,
} from "./types";
