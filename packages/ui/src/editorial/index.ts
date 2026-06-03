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
  scorePassword,
} from "../internal/editorial-password";
export { AnimatedField } from "./animated-field";
export { AuthShell } from "./auth-shell";
export { BrandMark } from "./brand-mark";
export { ConsentCheckbox, type ConsentCheckboxProps } from "./consent-checkbox";
export { DisplayHeading, IntroBlock, SubtitleLine } from "./display-heading";
export { EditorialLabel } from "./editorial-label";
export { FieldError } from "./field-error";
export { editorialFonts } from "./fonts";
export { FooterPrompt, type FooterPromptProps } from "./footer-prompt";
export { InlineLink, type InlineLinkProps } from "./inline-link";
export { OAuthButton, type OAuthButtonProps } from "./oauth-button";
export { OrDivider } from "./or-divider";
export { PasswordInput, type PasswordInputProps } from "./password-input";
export { PasswordStrengthMeter } from "./password-strength-meter";
export { PrimaryAction, type PrimaryActionProps } from "./primary-action";
export { UnderlineInput, type UnderlineInputProps } from "./underline-input";
export { Wordmark } from "./wordmark";

export type AuthTextInputRef = ComponentRef<typeof TextInput>;
