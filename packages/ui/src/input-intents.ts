/**
 * Input/Textarea-specific component tokens.
 *
 * Intent only affects border + focus border. Text + placeholder are always
 * neutral. This gives you a red-bordered input for error state without
 * recoloring the text the user is typing.
 */

import type { IntentKey, RequireKeys } from './design';
import { intents, resolveIntent } from './design';

export type InputSlots = RequireKeys<
  {
    borderColor?: string;
    borderColorFocus?: string;
  },
  'borderColor' | 'borderColorFocus'
>;

const BASE_CLASSES =
  'w-full rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all';

// Text + placeholder colors are fixed: they express user input, not intent.
const TEXT_CLASSES = 'text-gray-900 dark:text-neutral-200';
const PLACEHOLDER_CLASSES = 'placeholder:text-gray-500/50 dark:placeholder:text-neutral-500/50';

function inputSlotsFor(intent: IntentKey): InputSlots {
  const r = resolveIntent(intents[intent], {
    borderColor: true,
    borderColorFocus: true,
  });
  return {
    borderColor: r.borderColor,
    borderColorFocus: r.borderColorFocus,
  };
}

export function getInputClasses(intent: IntentKey, extra = ''): string {
  const slots = inputSlotsFor(intent);
  return `${BASE_CLASSES} ${TEXT_CLASSES} ${PLACEHOLDER_CLASSES} ${slots.borderColor} ${slots.borderColorFocus} ${extra}`
    .trim()
    .replace(/\s+/g, ' ');
}
