/**
 * Button-specific component tokens.
 *
 * Each variant declares which slots from an `IntentTokens` object it needs.
 * The resolver merges `light` + `dark:` classes and, where appropriate,
 * prefixes utilities with `hover:` to form the final class string used by
 * the component.
 */

import type { IntentKey, RequireKeys } from './design';
import { intents, resolveIntent } from './design';
import type { ButtonSize, ButtonVariant } from './types';

// ──────────────────────────────────────────────────────────────────────────
// Slot contract
// ──────────────────────────────────────────────────────────────────────────

type ButtonSlotsAll = {
  textColor?: string;
  backgroundColor?: string;
  backgroundColorHover?: string;
  backgroundColorSubtle?: string; // used as hover bg on outline/ghost/icon/menu
  borderColor?: string;
  shadow?: string;
};

/** `textColor` is the only truly universal slot for the Button. */
export type ButtonSlots = RequireKeys<ButtonSlotsAll, 'textColor'>;

// ──────────────────────────────────────────────────────────────────────────
// Resolver helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Transform a string of tailwind utilities into their `hover:` variants,
 * preserving any `dark:` prefix.
 * `"bg-cyan-700 dark:bg-cyan-300"` → `"hover:bg-cyan-700 dark:hover:bg-cyan-300"`
 */
function asHover(utilities: string): string {
  return utilities
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) =>
      cls.startsWith('dark:') ? `dark:hover:${cls.slice('dark:'.length)}` : `hover:${cls}`,
    )
    .join(' ');
}

function buttonSlotsFor(variant: ButtonVariant, intent: IntentKey, selected: boolean): ButtonSlots {
  const tokens = intents[intent];
  switch (variant) {
    case 'solid': {
      const r = resolveIntent(tokens, {
        textColor: true,
        backgroundColor: true,
        backgroundColorHover: true,
      });
      return {
        textColor: r.textColor,
        backgroundColor: r.backgroundColor,
        backgroundColorHover: asHover(r.backgroundColorHover),
      };
    }
    case 'outline': {
      const r = resolveIntent(tokens, {
        mutedTextColor: true,
        borderColor: true,
        backgroundColorSubtle: true,
      });
      return {
        textColor: r.mutedTextColor,
        borderColor: `border ${r.borderColor}`,
        backgroundColorSubtle: asHover(r.backgroundColorSubtle),
      };
    }
    case 'ghost':
    case 'icon':
    case 'menu': {
      const r = resolveIntent(tokens, {
        mutedTextColor: true,
        backgroundColorSubtle: true,
      });
      return {
        textColor: r.mutedTextColor,
        backgroundColorSubtle: asHover(r.backgroundColorSubtle),
      };
    }
    case 'tab': {
      if (selected) {
        // Raised pill on top of a muted wrapper — always neutral by design.
        return {
          textColor: 'text-gray-800 dark:text-neutral-200',
          backgroundColor: 'bg-white dark:bg-neutral-600',
          shadow: 'shadow-sm',
        };
      }
      const r = resolveIntent(tokens, { mutedTextColor: true });
      return { textColor: r.mutedTextColor };
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Sizes (shape concerns — unchanged)
// ──────────────────────────────────────────────────────────────────────────

const sizeStyles: Record<ButtonVariant, Record<ButtonSize, string>> = {
  solid: {
    xs: 'rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest',
    sm: 'rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest',
    md: 'rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest',
    lg: 'rounded-full py-3 text-xs font-bold uppercase tracking-widest',
  },
  outline: {
    xs: 'rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest',
    sm: 'rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest',
    md: 'rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest',
    lg: 'rounded-full py-3 text-xs font-bold uppercase tracking-widest',
  },
  ghost: {
    xs: 'rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-widest',
    sm: 'rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest',
    md: 'rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-widest',
    lg: 'rounded-lg py-3 text-xs font-semibold uppercase tracking-widest',
  },
  icon: {
    xs: 'rounded-lg p-1',
    sm: 'rounded-lg p-1.5',
    md: 'rounded-lg p-2',
    lg: 'rounded-lg p-2.5',
  },
  menu: {
    xs: 'w-full px-3 py-1.5 text-left text-[10px]',
    sm: 'w-full px-3 py-2 text-left text-xs',
    md: 'w-full px-4 py-2.5 text-left text-sm',
    lg: 'w-full px-4 py-3 text-left text-sm',
  },
  tab: {
    xs: 'rounded px-2 py-0.5 text-[10px] font-semibold transition-all',
    sm: 'rounded px-3 py-1 text-xs font-semibold transition-all',
    md: 'rounded-lg px-4 py-1.5 text-sm font-semibold transition-all',
    lg: 'rounded-lg px-5 py-2 text-sm font-semibold transition-all',
  },
};

const BASE_CLASS =
  'inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50';
const MENU_BASE_CLASS = 'flex items-center gap-2 transition-colors disabled:opacity-50';

export type ButtonCase = 'upper' | 'normal';

export function getButtonClasses(
  variant: ButtonVariant,
  intent: IntentKey,
  size: ButtonSize,
  fullWidth: boolean,
  selected: boolean,
  extra = '',
  textCase: ButtonCase = 'upper',
): string {
  const slots = buttonSlotsFor(variant, intent, selected);
  const base = variant === 'menu' ? MENU_BASE_CLASS : BASE_CLASS;
  const rawSize = sizeStyles[variant][size];
  // When the caller opts into `case="normal"`, strip the typography tokens that
  // force caps so the label renders in sentence case. Keeps every other shape
  // concern (padding, radius, font weight baseline) intact.
  const sizeClasses =
    textCase === 'normal'
      ? rawSize.replace(/\buppercase\b/g, 'normal-case').replace(/\btracking-widest\b/g, '')
      : rawSize;
  const widthClass =
    fullWidth || (size === 'lg' && variant !== 'icon' && variant !== 'menu' && variant !== 'tab')
      ? 'w-full'
      : '';
  const slotClasses = [
    slots.textColor,
    slots.backgroundColor,
    slots.backgroundColorHover,
    slots.backgroundColorSubtle,
    slots.borderColor,
    slots.shadow,
  ]
    .filter(Boolean)
    .join(' ');
  return `${base} ${slotClasses} ${sizeClasses} ${widthClass} ${extra}`.trim().replace(/\s+/g, ' ');
}
