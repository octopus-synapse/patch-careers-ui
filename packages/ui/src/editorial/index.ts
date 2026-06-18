/**
 * `@patch-careers/ui/editorial` — the "Editorial Calm" design system.
 *
 * Warm-paper auth/onboarding aesthetic: serif italic display, hairline
 * inputs, deep-ink CTA, blue used sparingly. Rebuilt on Tamagui + the
 * `editorial` token sub-theme (`@patch-careers/tokens`), keeping Reanimated 4
 * for the bespoke micro-animations (focus underline, CTA nudge, stagger).
 *
 * Router-agnostic by design: InlineLink/FooterPrompt/ConsentCheckbox take
 * `onPress` callbacks; OAuthButton takes its brand glyph as an `icon` prop.
 */

import type { ComponentRef } from "react";
import type { TextInput } from "react-native";

// Pure logic re-exported for consumers that need it directly (and for the
// app's back-compat shim).
export {
  type PasswordCheck,
  type PasswordHints,
  type PasswordStrengthScore,
  passwordChecks,
  type StrengthLabels,
  scorePassword,
} from "../internal/editorial-password";
export { useEditorialPalette } from "../internal/use-editorial-palette";
export { useThemeName } from "../internal/use-theme-name";
export { AnimatedField } from "./animated-field";
export { AuthShell } from "./auth-shell";
export { Banner, type BannerIntent, type BannerProps } from "./banner";
export { BrandMark } from "./brand-mark";
export { CaptionButton, type CaptionButtonProps } from "./caption-button";
export { CheckboxField, type CheckboxFieldProps } from "./checkbox-field";
export { ConsentCheckbox, type ConsentCheckboxProps } from "./consent-checkbox";
export { CountBadge, type CountBadgeProps } from "./count-badge";
export { DisplayHeading, IntroBlock, SubtitleLine } from "./display-heading";
export { EditableRow, type EditableRowProps } from "./editable-row";
export { EditorialLabel } from "./editorial-label";
export { EditorialTextLink, type EditorialTextLinkProps } from "./editorial-text-link";
export { FieldError } from "./field-error";
export { editorialFonts } from "./fonts";
export { FooterPrompt, type FooterPromptProps } from "./footer-prompt";
export { InlineLink, type InlineLinkProps } from "./inline-link";
export { OAuthButton, type OAuthButtonProps } from "./oauth-button";
export { OrDivider } from "./or-divider";
export { PasswordInput, type PasswordInputProps } from "./password-input";
export { PasswordStrengthMeter } from "./password-strength-meter";
export { PatchLogo } from "./patch-logo";
export { PrimaryAction, type PrimaryActionProps } from "./primary-action";
export { type SegmentedTab, SegmentedTabs, type SegmentedTabsProps } from "./segmented-tabs";
export { ToggleField, type ToggleFieldProps } from "./toggle-field";
export { UnderlineInput, type UnderlineInputProps } from "./underline-input";
export { Wordmark } from "./wordmark";

export type AuthTextInputRef = ComponentRef<typeof TextInput>;
