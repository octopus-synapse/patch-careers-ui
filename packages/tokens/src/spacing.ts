/**
 * Spacing scale based on a 4px base unit.
 * Numeric keys correspond to `n * 4px` (e.g. `4` = 16, `6` = 24)
 * for the common 0..6 range, with named jumps `8` (32), `10` (40),
 * `12` (48), `16` (64), `20` (80), `24` (96).
 *
 * Density: confortável (D63) — padding-card 16-20px, gaps 12-16px.
 */

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
