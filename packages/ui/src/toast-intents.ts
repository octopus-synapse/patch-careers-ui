/**
 * Toast-specific component tokens.
 *
 * Ephemeral notification pill: soft background + readable text + accent icon.
 */

import type { IntentKey, RequireKeys } from './design';
import { intents, resolveIntent } from './design';

export type ToastSlots = RequireKeys<
  {
    textColor?: string;
    backgroundColor?: string;
    iconColor?: string;
  },
  'textColor' | 'backgroundColor' | 'iconColor'
>;

function toastSlotsFor(intent: IntentKey): ToastSlots {
  const r = resolveIntent(intents[intent], {
    textColorOnSoft: true,
    backgroundColorSoft: true,
    iconColor: true,
  });
  return {
    textColor: r.textColorOnSoft,
    backgroundColor: r.backgroundColorSoft,
    iconColor: r.iconColor,
  };
}

export function getToastClasses(intent: IntentKey): {
  container: string;
  icon: string;
} {
  const slots = toastSlotsFor(intent);
  return {
    container: `${slots.backgroundColor} ${slots.textColor}`.replace(/\s+/g, ' '),
    icon: slots.iconColor,
  };
}
