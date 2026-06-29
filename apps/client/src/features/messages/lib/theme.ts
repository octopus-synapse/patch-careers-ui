/**
 * Chat-specific colour decisions, layered on top of the Editorial Calm
 * palette so the thread reads as the same product as auth/onboarding:
 * a soft accent tint for your own bubbles, surface + hairline for theirs,
 * deep-ink send button, blue reserved for links/ticks/unread only.
 *
 * Theme-aware: both variants are precomputed from the light/dark palettes and
 * `useChatColors()` resolves the active one — no per-render object churn.
 */

import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { useThemeName } from "@patch-careers/ui/editorial";

const chatColorsFor = (p: EditorialPalette, ownBubble: string) =>
  ({
    ownBubble, // accent at low tint — "blue used sparingly"
    otherBubble: p.surface,
    ownText: p.ink,
    otherText: p.body,
    sendButton: p.primary, // matches the editorial CTA fill
    sendButtonFg: p.onPrimary,
    tickRead: p.accent,
    tickSent: p.subtle,
    unread: p.accent,
  }) as const;

const chatColorsByTheme = {
  // @style-allow color: own chat-bubble accent tint (light) passed to the chatColorsFor helper — "blue used sparingly"
  light: chatColorsFor(editorialPalette, "#EAF1FE"),
  // @style-allow color: own chat-bubble accent tint (dark) passed to the chatColorsFor helper — "blue used sparingly"
  dark: chatColorsFor(editorialPaletteDark, "#22324A"),
} as const;

export type ChatColors = (typeof chatColorsByTheme)["light"];

export function useChatColors(): ChatColors {
  return chatColorsByTheme[useThemeName()];
}
