import type { IntentSlotName, IntentStyles, IntentTokens } from './global.types';

export type ResolvedIntent<TSlots extends IntentStyles> = {
  [K in keyof TSlots]-?: string;
};

/**
 * Merge the `light` and `dark` scales of an intent into a single record of
 * Tailwind class strings. The dark scale values are prefixed with `dark:`
 * so the resulting string can be dropped straight into a component.
 *
 * @example
 * resolveIntent(intents.accent, { backgroundColor: true, textColor: true })
 * // → { backgroundColor: 'bg-cyan-600 dark:bg-cyan-400', textColor: 'text-white dark:text-white' }
 */
export function resolveIntent<TMap extends Partial<Record<IntentSlotName, boolean>>>(
  intent: IntentTokens,
  wanted: TMap,
): Record<Extract<keyof TMap, IntentSlotName>, string> {
  const out = {} as Record<Extract<keyof TMap, IntentSlotName>, string>;
  for (const key of Object.keys(wanted) as Array<keyof TMap & IntentSlotName>) {
    if (!wanted[key]) continue;
    const lightValue = intent.light[key];
    const darkValue = intent.dark[key];
    const parts: string[] = [];
    if (lightValue) parts.push(lightValue);
    if (darkValue) parts.push(prefixWithDark(darkValue));
    out[key as Extract<keyof TMap, IntentSlotName>] = parts.join(' ');
  }
  return out;
}

/** Turn `"bg-cyan-400"` into `"dark:bg-cyan-400"` (applies to each utility in the string). */
function prefixWithDark(utilityClasses: string): string {
  return utilityClasses
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) => `dark:${cls}`)
    .join(' ');
}
