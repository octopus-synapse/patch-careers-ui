/**
 * Core design-system primitives shared across components.
 */

export type ColorScheme = 'light' | 'dark';

/** Semantic color categories ("intents"). Global across the design system. */
export type IntentKey = 'neutral' | 'accent' | 'danger' | 'success' | 'warning' | 'info';

/**
 * Slots that a color intent can expose. A single intent (like `accent`)
 * declares values for a subset of these in its `light` and `dark` scales.
 *
 * Components use the slots they care about and ignore the rest.
 */
export type IntentSlotName =
  | 'textColor'
  | 'mutedTextColor'
  | 'backgroundColor'
  | 'backgroundColorHover'
  | 'backgroundColorSubtle' // /10 overlay — used as hover bg on outline/ghost
  | 'backgroundColorSoft' // solid -50 — used by badges/toasts
  | 'textColorOnSoft' // -700 — reads well on backgroundColorSoft
  | 'borderColor'
  | 'borderColorFocus' // focus:border-{color}-500 — used by Input on focus
  | 'iconColor';

/** One scale of an intent — a plain object of Tailwind utility classes. */
export type IntentScale = Partial<Record<IntentSlotName, string>>;

/** Full intent definition: both color schemes side by side. */
export type IntentTokens = {
  light: IntentScale;
  dark: IntentScale;
};

/** Utility: mark some optional keys as required. */
export type RequireKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] };
