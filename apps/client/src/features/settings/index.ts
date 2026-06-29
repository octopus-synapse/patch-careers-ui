/**
 * Public API for the settings feature. Route files in `app/settings/**` import
 * only from this barrel (ADR-0002).
 */

export { type PillOption, PillSelect, SectionHeader } from "./components/settings-ui";
export { useSet } from "./lib/styles";
export type {
  ConnectedProvider,
  MessagePrivacy,
  ProfileVisibility,
  VerifyFlow,
} from "./types";
