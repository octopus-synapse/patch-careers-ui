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
export type LandingBrandFacePalette = {
  sclera: string;
  pupil: string;
  highlight: string;
};

/**
 * The two puzzle pieces — the mascot's body AND every brandmark.
 *
 * "A logo é o mascote", so these cannot be allowed to drift apart. They had:
 * the mascot on #000/#FFF + #5766E8, BrandMark on #151A30/#E9E5D9 + #5766E8/
 * #6272F2, BrandLockup on a third pair, and BrandFace on the landing accents
 * (#111111/#F5F5F0 + #5766E8/#8C97FF). In dark the marks drifted to a warm
 * ivory and a washed-out periwinkle that no longer looked like the mascot.
 *
 * `indigo` never changes — it IS the brand colour. `plain` flips with the
 * scheme so the piece always reads against the page.
 */
export type BrandPiecePalette = {
  plain: string;
  indigo: string;
};

export const brandPieces = {
  plain: "#000000",
  indigo: "#5766E8",
} as const satisfies BrandPiecePalette;

export const brandPiecesDark = {
  plain: "#FFFFFF",
  indigo: "#5766E8",
} as const satisfies BrandPiecePalette;

export const brandPiecePalettes = {
  light: brandPieces,
  dark: brandPiecesDark,
} as const satisfies Record<EditorialTheme, BrandPiecePalette>;

export const landingBrandFace = {
  sclera: "#DDE3F5",
  pupil: "#151A30",
  highlight: "#FFFFFF",
} as const satisfies LandingBrandFacePalette;

/**
 * The face does NOT flip with the pieces. Inverting it — dark sclera, light
 * pupil — turned both eyes into holes punched through the mark at navbar
 * size, which is the opposite of the reading a face wants.
 *
 * Eyes are eyes in either scheme: the mascot proves it, carrying one sclera
 * and one pupil across both themes (`SCLERA`/`PUPIL` in mascot-model.ts, and
 * `landingRobot.eye` identical light and dark). The logo is the mascot, so it
 * uses the mascot's eyes. Only the pieces underneath change with the theme.
 */
export const landingBrandFaceDark = {
  sclera: landingBrandFace.sclera,
  pupil: landingBrandFace.pupil,
  highlight: landingBrandFace.highlight,
} as const satisfies LandingBrandFacePalette;

export const landingBrandFacePalettes = {
  light: landingBrandFace,
  dark: landingBrandFaceDark,
} as const satisfies Record<EditorialTheme, LandingBrandFacePalette>;

/**
 * The mascot's legs (scene + finale walks): limb stroke matches each piece,
 * boots are the piece colour with the prototype's sole/outline accents.
 */
export type LandingMascotLegPalette = {
  limb: string;
  boot: string;
  sole: string;
  outline: string;
};

export const landingMascotLegs = {
  left: { limb: "#111111", boot: "#111111", sole: "#3A4160", outline: "rgba(221,227,245,0.55)" },
  right: { limb: "#5766E8", boot: "#5766E8", sole: "#8A95F5", outline: "#3B47B8" },
} as const satisfies Record<"left" | "right", LandingMascotLegPalette>;

/**
 * Dark legs follow the inverted pieces: the left limb/boot go near-white
 * (an #111 leg would sink into the dark paper), the right lifts with the
 * dark indigo. Outlines flip polarity — dark rim around the light boot.
 */
export const landingMascotLegsDark = {
  left: { limb: "#F5F5F0", boot: "#F5F5F0", sole: "#2E3450", outline: "rgba(21,26,48,0.55)" },
  right: { limb: "#8C97FF", boot: "#8C97FF", sole: "#B9C1FF", outline: "#4C58CC" },
} as const satisfies Record<"left" | "right", LandingMascotLegPalette>;

export const landingMascotLegsPalettes = {
  light: landingMascotLegs,
  dark: landingMascotLegsDark,
} as const satisfies Record<EditorialTheme, Record<"left" | "right", LandingMascotLegPalette>>;

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

/**
 * Dark ramp: inks brighten to hold ~4.5:1 on the dark washes (same family
 * the robot's dark LEDs use); washes become deep tints of each hue instead
 * of pastels, so the grade chips read as lit panels on the dark paper.
 */
export const landingScoreRampDark = {
  excellent: { ink: "#4ADE80", wash: "#1D2E28" },
  good: { ink: "#E3B23C", wash: "#332B18" },
  fair: { ink: "#FB923C", wash: "#33241A" },
  poor: { ink: "#F87171", wash: "#3A2222" },
} as const satisfies Record<LandingScoreBand, LandingScoreColor>;

export const landingScoreRampPalettes = {
  light: landingScoreRamp,
  dark: landingScoreRampDark,
} as const satisfies Record<EditorialTheme, Record<LandingScoreBand, LandingScoreColor>>;

export function landingScoreBand(value: number): LandingScoreBand {
  if (value >= 85) return "excellent";
  if (value >= 70) return "good";
  if (value >= 50) return "fair";
  return "poor";
}
