/**
 * Badge-specific component tokens.
 *
 * A badge is a chip-like label: soft background + readable text. Every intent
 * contributes a `backgroundColorSoft` + `textColorOnSoft` pair via the
 * global design system.
 */

import type { IntentKey, RequireKeys } from './design';
import { intents, resolveIntent } from './design';

export type BadgeSize = 'sm' | 'md';

export type BadgeSlots = RequireKeys<
  {
    textColor?: string;
    backgroundColor?: string;
  },
  'textColor' | 'backgroundColor'
>;

function badgeSlotsFor(intent: IntentKey): BadgeSlots {
  const r = resolveIntent(intents[intent], {
    textColorOnSoft: true,
    backgroundColorSoft: true,
  });
  return {
    textColor: r.textColorOnSoft,
    backgroundColor: r.backgroundColorSoft,
  };
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'rounded px-1.5 py-0.5 text-[9px] font-semibold',
  md: 'rounded-full px-2.5 py-1 text-[10px] font-semibold',
};

export function getBadgeClasses(intent: IntentKey, size: BadgeSize): string {
  const slots = badgeSlotsFor(intent);
  return `${slots.backgroundColor} ${slots.textColor} ${sizeStyles[size]}`
    .trim()
    .replace(/\s+/g, ' ');
}
