/**
 * Color palette and semantic intent tokens.
 *
 * Two layers:
 *   1. `palette` — raw color ramps (gray, blue, red, green) 50..900
 *   2. `intent` — semantic tokens (neutral/accent/danger/success) with
 *      `light` and `dark` variants exposing `bg`, `fg`, `border`,
 *      `hoverBg`, `pressBg`, `subtleBg`, `subtleFg`
 *
 * A Tamagui wrapper (PR #6) maps these to `createTamagui()`.
 */

export type ColorRamp = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export const palette = {
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
} as const satisfies Record<string, ColorRamp>;

export type Palette = typeof palette;
export type PaletteName = keyof Palette;

export type IntentTokens = {
  bg: string;
  fg: string;
  border: string;
  hoverBg: string;
  pressBg: string;
  subtleBg: string;
  subtleFg: string;
};

export type IntentVariant = {
  light: IntentTokens;
  dark: IntentTokens;
};

export type IntentName = "neutral" | "accent" | "danger" | "success";

export const intent: Record<IntentName, IntentVariant> = {
  neutral: {
    light: {
      bg: palette.gray[100],
      fg: palette.gray[900],
      border: palette.gray[300],
      hoverBg: palette.gray[200],
      pressBg: palette.gray[300],
      subtleBg: palette.gray[50],
      subtleFg: palette.gray[700],
    },
    dark: {
      bg: palette.gray[800],
      fg: palette.gray[50],
      border: palette.gray[700],
      hoverBg: palette.gray[700],
      pressBg: palette.gray[600],
      subtleBg: palette.gray[900],
      subtleFg: palette.gray[300],
    },
  },
  accent: {
    light: {
      bg: palette.blue[600],
      fg: palette.gray[50],
      border: palette.blue[700],
      hoverBg: palette.blue[700],
      pressBg: palette.blue[800],
      subtleBg: palette.blue[50],
      subtleFg: palette.blue[700],
    },
    dark: {
      bg: palette.blue[500],
      fg: palette.gray[50],
      border: palette.blue[400],
      hoverBg: palette.blue[400],
      pressBg: palette.blue[300],
      subtleBg: palette.blue[900],
      subtleFg: palette.blue[200],
    },
  },
  danger: {
    light: {
      bg: palette.red[600],
      fg: palette.gray[50],
      border: palette.red[700],
      hoverBg: palette.red[700],
      pressBg: palette.red[800],
      subtleBg: palette.red[50],
      subtleFg: palette.red[700],
    },
    dark: {
      bg: palette.red[500],
      fg: palette.gray[50],
      border: palette.red[400],
      hoverBg: palette.red[400],
      pressBg: palette.red[300],
      subtleBg: palette.red[900],
      subtleFg: palette.red[200],
    },
  },
  success: {
    light: {
      bg: palette.green[600],
      fg: palette.gray[50],
      border: palette.green[700],
      hoverBg: palette.green[700],
      pressBg: palette.green[800],
      subtleBg: palette.green[50],
      subtleFg: palette.green[700],
    },
    dark: {
      bg: palette.green[500],
      fg: palette.gray[50],
      border: palette.green[400],
      hoverBg: palette.green[400],
      pressBg: palette.green[300],
      subtleBg: palette.green[900],
      subtleFg: palette.green[200],
    },
  },
};

export const colors = { palette, intent };

export type Colors = typeof colors;
