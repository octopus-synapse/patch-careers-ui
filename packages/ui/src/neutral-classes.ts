/**
 * Shortcut classes for components that only use the neutral intent.
 *
 * Keeps Label/Tooltip/EmptyState consuming the same tokens as the rest of
 * the system so a future neutral palette tweak propagates everywhere.
 */

import { intents, resolveIntent } from './design';

const neutral = resolveIntent(intents.neutral, {
  textColor: true,
  mutedTextColor: true,
  backgroundColor: true,
  backgroundColorHover: true,
});

/** Muted text: "text-gray-500 dark:text-neutral-400". */
export const neutralMutedText = neutral.mutedTextColor;

/** Solid inverse bg + text for things like tooltips. */
export const neutralSolidContainer = `${neutral.backgroundColor} ${neutral.textColor}`.replace(
  /\s+/g,
  ' ',
);

/** Arrow border color matching the tooltip bg (for triangles). */
export const neutralSolidBg = neutral.backgroundColor; // e.g. "bg-gray-800 dark:bg-neutral-200"
