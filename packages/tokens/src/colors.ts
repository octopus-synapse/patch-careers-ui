/**
 * Color palette and semantic intent tokens.
 *
 * Two layers:
 *   1. `palette` — raw color ramps (gray, blue, red, green) 50..900
 *   2. `intent` — semantic tokens (neutral/accent/danger/success) with
 *      `light` and `dark` variants exposing `bg`, `fg`, `border`,
 *      `hoverBg`, `pressBg`, `subtleBg`, `subtleFg`
 *
 * The `dark` variants are anchored to the warm dark paper editorial palette,
 * NOT to the Tailwind gray ramp — Tailwind's "gray" is slate (blue-cast), and
 * slate surfaces/borders read as navy against the warm `#161512` paper.
 *
 * A Tamagui wrapper (PR #6) maps these to `createTamagui()`.
 */

import { editorialPaletteDark } from "./editorial";

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
      bg: editorialPaletteDark.surface,
      fg: editorialPaletteDark.ink,
      border: editorialPaletteDark.hairlineStrong,
      hoverBg: editorialPaletteDark.hairline,
      pressBg: "#46443D",
      subtleBg: editorialPaletteDark.bg,
      subtleFg: editorialPaletteDark.body,
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
    // Filled accent inverts like the editorial CTA: light-blue fill, dark ink
    // content. `subtleBg` is the one deliberately blue-tinted dark wash
    // (matches the chat own-bubble tone) — never used for neutral chrome.
    dark: {
      bg: editorialPaletteDark.accent,
      fg: editorialPaletteDark.bg,
      border: editorialPaletteDark.accent,
      hoverBg: palette.blue[300],
      pressBg: palette.blue[200],
      subtleBg: "#22324A",
      subtleFg: palette.blue[300],
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
      bg: editorialPaletteDark.danger,
      fg: editorialPaletteDark.bg,
      border: editorialPaletteDark.danger,
      hoverBg: palette.red[300],
      pressBg: palette.red[200],
      subtleBg: "#3B1D1B",
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
      bg: editorialPaletteDark.success,
      fg: editorialPaletteDark.bg,
      border: editorialPaletteDark.success,
      hoverBg: palette.green[300],
      pressBg: palette.green[200],
      subtleBg: "#17291C",
      subtleFg: palette.green[200],
    },
  },
};

export const colors = { palette, intent };

export type Colors = typeof colors;
