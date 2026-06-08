/**
 * Shared "section editor" toolkit — the editorial multi-item editor (work
 * experience, education, …) plus the field controls, primitives and styles it
 * is built from. Consumed by both the onboarding wizard and the Profile tab.
 */
export { FieldRenderer } from "./FieldRenderer";
export { itemCardParts, itemSummary, monthLabel, parseYearMonth } from "./helpers";
export {
  AddRow,
  FieldLabel,
  FieldShell,
  GhostButton,
  OptionPill,
  OverlayModal,
} from "./primitives";
export { SectionForm } from "./SectionForm";
export { SectionItemEditor } from "./SectionItemEditor";
export { ed, eyebrow, webNoOutline } from "./styles";
export type {
  FormData,
  SectionDescriptor,
  SectionField,
  SectionItem,
  SectionPersistAction,
} from "./types";
export { validateSectionFields } from "./validation";
