/**
 * Loader-specific component tokens.
 *
 * The spinner uses the intent's `mutedTextColor` — same slot as Badge/Input's
 * accent color. Keeps a spinning indicator legibly colored without competing
 * with surrounding content.
 */

import type { IntentKey, RequireKeys } from '../../shared';
import { intents, resolveIntent } from '../../shared';

export type LoaderSlots = RequireKeys<
  {
    textColor?: string;
  },
  'textColor'
>;

function loaderSlotsFor(intent: IntentKey): LoaderSlots {
  const r = resolveIntent(intents[intent], { mutedTextColor: true });
  return { textColor: r.mutedTextColor };
}

export function getLoaderClasses(intent: IntentKey, extra = ''): string {
  const slots = loaderSlotsFor(intent);
  return `animate-spin ${slots.textColor} ${extra}`.trim().replace(/\s+/g, ' ');
}
