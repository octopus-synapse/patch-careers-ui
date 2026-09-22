/**
 * Public API for the settings feature. Route files in `app/settings/**` import
 * only from this barrel (ADR-0002).
 */

export { AccountLanguageSync } from "./components/account-language-sync";
export { AccountSection } from "./components/account-section";
export { NotificationsSection } from "./components/notifications-section";
export { PreferencesSection } from "./components/preferences-section";
export { PrivacySection } from "./components/privacy-section";
export { SettingsDesktopPage } from "./components/settings-desktop-page";
export { SettingsSectionHeading } from "./components/settings-section-heading";
export {
  type PillOption,
  PillSelect,
  SectionHeader,
  SegmentedSelect,
  SettingSelectRow,
} from "./components/settings-ui";
export {
  SETTINGS_SECTIONS,
  type SettingsSection,
  type SettingsSectionId,
  settingsSectionForPath,
  settingsSectionHref,
} from "./lib/sections";
export { useSet } from "./lib/styles";
export type {
  MessagePrivacy,
  ProfileVisibility,
  VerifyFlow,
} from "./types";
