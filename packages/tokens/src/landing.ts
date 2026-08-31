/**
 * Landing palette — the marketing page's per-chapter accents.
 *
 * The landing is a sequence of full-screen chapters, each tinted by one accent
 * (the heading's emphasised clause, the mascot's glow, the active rail dot).
 * `accent` is the saturated ink; `soft` is the wash the radial glow fades from.
 *
 * These are NOT the editorial palette's `accent`/`accentDeep`: the app's accent
 * is a UI blue (#2563EB) tuned for focus rings, while the landing's indigo is
 * the brand mark's own blue (#5766E8). Keeping them apart is deliberate — the
 * marketing page speaks in brand colour, the product speaks in UI colour.
 *
 * They live in `@patch-careers/tokens` (not in the feature) because
 * `apps/client/src` is scanned by `no-stylesheet-inline-styles`, which rejects
 * every hex literal; the landing consumes these by name.
 *
 * Dark values lift each accent toward the light end so it holds contrast on
 * warm dark paper, and re-pick the wash as a dim warm tint rather than the
 * light scheme's pastel — every value stays an opaque 6-digit hex, asserted in
 * `landing.spec.ts`.
 */

import type { EditorialTheme } from "./editorial";

/** One chapter tint: the saturated ink and the wash its glow fades from. */
export type LandingAccent = {
  accent: string;
  soft: string;
};

/** The six chapter tints, in the order the page uses them. */
export type LandingAccentKey = "ink" | "blush" | "indigo" | "mint" | "amber" | "violet";

export const landingAccents = {
  ink: { accent: "#111111", soft: "#ECE8E0" },
  blush: { accent: "#D9457A", soft: "#FBE4EC" },
  indigo: { accent: "#5766E8", soft: "#E9EBFC" },
  mint: { accent: "#1FA274", soft: "#DFF4EA" },
  amber: { accent: "#C08A00", soft: "#F8EFD0" },
  violet: { accent: "#7A4FD6", soft: "#EEE7FB" },
} as const satisfies Record<LandingAccentKey, LandingAccent>;

export const landingAccentsDark = {
  ink: { accent: "#F5F5F0", soft: "#2B2A26" },
  blush: { accent: "#F2789F", soft: "#3A2229" },
  indigo: { accent: "#8C97FF", soft: "#242742" },
  mint: { accent: "#4FD3A0", soft: "#1D2E28" },
  amber: { accent: "#E3B23C", soft: "#332B18" },
  violet: { accent: "#A98BEE", soft: "#2B2340" },
} as const satisfies Record<LandingAccentKey, LandingAccent>;

export const landingAccentPalettes = {
  light: landingAccents,
  dark: landingAccentsDark,
} as const satisfies Record<EditorialTheme, Record<LandingAccentKey, LandingAccent>>;

/**
 * The robot that argues with the mascot in the "burro, não malvado" chapter.
 * A machine, so it sits outside the warm editorial palette: cool shell, near
 * black screen, and a blue LED that swaps for the reject/accept states.
 */
export type LandingRobotPalette = {
  shell: string;
  shellStroke: string;
  grey: string;
  screen: string;
  ear: string;
  earHighlight: string;
  eye: string;
  chestIdle: string;
  chestBad: string;
  chestGood: string;
  ledIdle: string;
  ledBusy: string;
  ledBad: string;
  ledGood: string;
  tear: string;
  beam: string;
};

export const landingRobot = {
  shell: "#F4F2EC",
  shellStroke: "#CFCAC0",
  grey: "#B9B4A9",
  screen: "#15171F",
  ear: "#3E7BFF",
  earHighlight: "#9CC0FF",
  eye: "#EAF2FF",
  chestIdle: "#8FD3FF",
  chestBad: "#FF7B84",
  chestGood: "#5FE0A8",
  ledIdle: "#8A8F9E",
  ledBusy: "#D9A400",
  ledBad: "#E5484D",
  ledGood: "#1FB27A",
  tear: "#7FB4FF",
  beam: "#E5484D",
} as const satisfies LandingRobotPalette;

export const landingRobotDark = {
  shell: "#2B2A26",
  shellStroke: "#4A4842",
  grey: "#6B675F",
  screen: "#0E0F14",
  ear: "#6A9BFF",
  earHighlight: "#B6D0FF",
  eye: "#EAF2FF",
  chestIdle: "#8FD3FF",
  chestBad: "#FF9CA3",
  chestGood: "#7FE9BE",
  ledIdle: "#5F5F5A",
  ledBusy: "#E3B23C",
  ledBad: "#F87171",
  ledGood: "#4ADE80",
  tear: "#9CC0FF",
  beam: "#F87171",
} as const satisfies LandingRobotPalette;

export const landingRobotPalettes = {
  light: landingRobot,
  dark: landingRobotDark,
} as const satisfies Record<EditorialTheme, LandingRobotPalette>;

/**
 * The demo score ramp — the four grade bands the prototype paints resumes
 * with (85+/70+/50+/below). Distinct from the product's own `scoreTone` scale
 * on purpose: the landing quotes the prototype's exact visuals.
 */
/**
 * The navbar brandmark's face — the prototype's "a logo é o mascote": sclera,
 * pupil and highlight drawn over the two puzzle pieces.
 */
export const landingBrandFace = {
  sclera: "#DDE3F5",
  pupil: "#151A30",
  highlight: "#FFFFFF",
} as const;

/**
 * The mascot's legs (scene + finale walks): limb stroke matches each piece,
 * boots are the piece colour with the prototype's sole/outline accents.
 */
export const landingMascotLegs = {
  left: { limb: "#111111", boot: "#111111", sole: "#3A4160", outline: "rgba(221,227,245,0.55)" },
  right: { limb: "#5766E8", boot: "#5766E8", sole: "#8A95F5", outline: "#3B47B8" },
} as const;

export type LandingScoreBand = "excellent" | "good" | "fair" | "poor";

export type LandingScoreColor = {
  ink: string;
  wash: string;
};

export const landingScoreRamp = {
  excellent: { ink: "#1FB27A", wash: "#E3F6EE" },
  good: { ink: "#D9A400", wash: "#FBF3D4" },
  fair: { ink: "#F0743A", wash: "#FDEEE5" },
  poor: { ink: "#E5484D", wash: "#FDECEC" },
} as const satisfies Record<LandingScoreBand, LandingScoreColor>;

export function landingScoreBand(value: number): LandingScoreBand {
  if (value >= 85) return "excellent";
  if (value >= 70) return "good";
  if (value >= 50) return "fair";
  return "poor";
}
