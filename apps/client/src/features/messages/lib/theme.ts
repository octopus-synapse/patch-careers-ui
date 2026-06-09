/**
 * Chat-specific colour decisions, layered on top of the Editorial Calm
 * palette so the thread reads as the same product as auth/onboarding:
 * a soft accent tint for your own bubbles, white + hairline for theirs,
 * deep-ink send button, blue reserved for links/ticks/unread only.
 */

import { editorialPalette } from "@patch-careers/tokens";

export const chatColors = {
  ownBubble: "#EAF1FE", // accent at low tint — "blue used sparingly"
  otherBubble: editorialPalette.surface,
  ownText: editorialPalette.ink,
  otherText: editorialPalette.body,
  sendButton: editorialPalette.primary, // deep ink, matches the editorial CTA
  sendButtonFg: editorialPalette.surface,
  tickRead: editorialPalette.accent,
  tickSent: editorialPalette.subtle,
  unread: editorialPalette.accent,
} as const;
