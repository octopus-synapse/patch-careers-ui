/**
 * Icon component type alias for lucide-svelte (F3-PD-021).
 *
 * `lucide-svelte` exports icons as untyped Component factories. Sites
 * that pass an icon through a generic prop (e.g. EmptyState's `icon`
 * slot) end up writing `as unknown as Component<{ size; class? }>` 24×
 * across the app. This helper isolates the cast to a single import.
 *
 * Usage:
 *   import { asIcon } from '$lib/types/icons';
 *   <EmptyState icon={asIcon(Users)} ... />
 */

import type { Component } from 'svelte';

export type IconComponent = Component<{ size?: number; class?: string }>;

/**
 * Narrows a lucide-svelte component reference to `IconComponent`.
 * Hot path: the underlying value IS the right shape; we just satisfy
 * TypeScript without spreading `as unknown as Component<...>` casts.
 */
export function asIcon(I: unknown): IconComponent {
  return I as IconComponent;
}
