/**
 * Border-radius tokens.
 * `full` is the "pill" radius (any value >= half height).
 */
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
} as const;

export type Radius = typeof radius;
export type RadiusKey = keyof Radius;
