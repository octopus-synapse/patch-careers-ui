/**
 * Pure color resolvers for the editorial components' state-dependent styling.
 *
 * These replace the inline ternaries that lived in `auth-shared.tsx`
 * (`hasError ? danger : accent`, etc.) so the branches are unit-testable and
 * the JSX wrappers stay declarative. The palette is injected (light or dark,
 * via `useEditorialPalette()`) so the same branches serve both themes.
 */

import type { EditorialPalette } from "@patch-careers/tokens";

/** UnderlineInput: the static hairline + the animated focus line color. */
export function resolveUnderlineColors(
  p: EditorialPalette,
  hasError: boolean,
): {
  hairline: string;
  focus: string;
} {
  return {
    hairline: hasError ? p.danger : p.hairlineStrong,
    focus: hasError ? p.danger : p.accent,
  };
}

/** EditorialLabel text color. */
export function resolveLabelColor(p: EditorialPalette, error: boolean): string {
  return error ? p.danger : p.muted;
}

/** OAuthButton ghost surface — flips on press. */
export function resolveOAuthColors(
  p: EditorialPalette,
  pressed: boolean,
): {
  backgroundColor: string;
  borderColor: string;
} {
  return {
    backgroundColor: pressed ? p.hairline : p.surface,
    borderColor: pressed ? p.muted : p.hairlineStrong,
  };
}

/** ConsentCheckbox square — checked wins over error wins over default. */
export function resolveConsentBoxColors(
  p: EditorialPalette,
  checked: boolean,
  hasError: boolean,
): { backgroundColor: string; borderColor: string } {
  if (checked) return { backgroundColor: p.primary, borderColor: p.primary };
  if (hasError) return { backgroundColor: p.surface, borderColor: p.danger };
  return { backgroundColor: p.surface, borderColor: p.hairlineStrong };
}
