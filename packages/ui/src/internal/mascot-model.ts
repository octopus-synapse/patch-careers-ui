/**
 * Auth mascot — pure model (no React, no Reanimated).
 *
 * The mascot is two jigsaw pieces (the "serious" one, which flips ink↔paper
 * with the scheme, and the "eager" indigo one) with articulated arms. Every
 * expression is a *pose*: a flat set of numeric targets (arm joint angles,
 * lid offsets, brow offsets, mouth, pupil) derived from a small set of flags.
 * Keeping this derivation pure means the choreography is unit-testable and
 * the component only has to tween towards whatever `poseFor` returns —
 * mirroring how the approved HTML prototype toggled CSS classes.
 *
 * Coordinates are the prototype's SVG user units (viewBox `-110 -60 500 …`):
 * the pieces span x 0…280, the card's top edge sits at y = 232.
 */

import { brandPieces, brandPiecesDark } from "@patch-careers/tokens";
import type { ThemeName } from "./types";

export interface MascotFlags {
  /** Name/e-mail focused: mouth open, eyes on the caret. */
  talk: boolean;
  /** Password focused and hidden: hands over the eyes. */
  covered: boolean;
  /** Password focused and visible: hands on the cheeks, peeking. */
  peek: boolean;
  /** Submit "snap": pieces split apart and click back together. */
  snap: boolean;
  /** Snap sub-phase: hands thrown up in surprise. */
  whoa: boolean;
  /** Snap finale: ^ ^ eyes and a grin. */
  happy: boolean;
  /** Left a field with an invalid value: grimace. */
  oops: boolean;
  /** E-mail currently valid: the sparkle. */
  valid: boolean;
  /**
   * The pieces have clicked together (account created): a settled, content
   * rest — soft lower-lid squint, brows relaxed. Base layer for the verify
   * screen; every reactive flag still wins over it.
   */
  sealed: boolean;
}

export const IDLE_FLAGS: MascotFlags = {
  talk: false,
  covered: false,
  peek: false,
  snap: false,
  whoa: false,
  happy: false,
  oops: false,
  valid: false,
  sealed: false,
};

export type MouthKind = "smile" | "happy" | "o" | "grin" | "flat";

export interface ArmPose {
  upper: number;
  fore: number;
  hand: number;
}

export interface MascotPose {
  armL: ArmPose;
  armR: ArmPose;
  /** Finger curl in degrees (negative = fingers folded over the card edge). */
  curl: number;
  /** Upper-lid translateY per piece (0 = open, 66 = shut). */
  lidTopL: number;
  lidTopR: number;
  /** Lower-lid translateY (−52 = the ^ ^ happy squint). */
  lidLow: number;
  browL: { y: number; rot: number };
  browR: { y: number; rot: number };
  mouth: MouthKind;
}

/** Hands hanging over the card edge — the prototype's rest pose. */
const REST_ARM_L: ArmPose = { upper: 12.1, fore: -96.7, hand: 274.6 };
const REST_ARM_R: ArmPose = { upper: -12.1, fore: 96.7, hand: 85.4 };
const COVER_ARM_L: ArmPose = { upper: -44.5, fore: -103, hand: 139.5 };
const COVER_ARM_R: ArmPose = { upper: 32.1, fore: 136, hand: 199.9 };
const PEEK_ARM_L: ArmPose = { upper: -20.5, fore: -96.9, hand: 113.4 };
const PEEK_ARM_R: ArmPose = { upper: -6.8, fore: 127.9, hand: 242.9 };
// Folded path (−286.2° ≡ 73.8°): the arm tucks in and unfolds instead of
// sweeping straight out sideways.
const WHOA_ARM_L: ArmPose = { upper: 157.8, fore: -286.2, hand: 103.4 };
const WHOA_ARM_R: ArmPose = { upper: -157.8, fore: 286.2, hand: 256.6 };

export const REST_CURL = -34;
/** The serious piece keeps a slightly drooped upper lid at rest. */
export const SERIOUS_LID_DROOP = 10;
/** Sealed: a gentle lower-lid squint, well short of the −52 "^ ^". */
export const SEALED_LID_SQUINT = -18;

/** Derives every animation target for a set of flags (later flags win). */
export function poseFor(flags: MascotFlags): MascotPose {
  const pose: MascotPose = {
    armL: REST_ARM_L,
    armR: REST_ARM_R,
    curl: REST_CURL,
    lidTopL: SERIOUS_LID_DROOP,
    lidTopR: 0,
    lidLow: 0,
    browL: { y: 3, rot: 0 },
    browR: { y: 0, rot: 0 },
    mouth: "smile",
  };

  if (flags.sealed) {
    pose.lidLow = SEALED_LID_SQUINT;
    pose.browL = { y: 0, rot: 0 };
    pose.browR = { y: -3, rot: 0 };
  }
  if (flags.talk) {
    pose.mouth = "happy";
    // Curiosity: only the eager piece raises a brow, inner end higher.
    pose.browR = { y: -6, rot: 8 };
  }
  if (flags.oops) {
    pose.mouth = "flat";
    pose.browL = { y: -4, rot: -10 };
    pose.browR = { y: 6, rot: -6 };
    pose.lidTopR = 20;
  }
  if (flags.covered) {
    pose.armL = COVER_ARM_L;
    pose.armR = COVER_ARM_R;
    pose.curl = 0;
    pose.lidTopL = 66;
    pose.lidTopR = 66;
    pose.browL = { y: 9, rot: 6 };
    pose.browR = { y: 6, rot: -6 };
  }
  if (flags.peek) {
    pose.armL = PEEK_ARM_L;
    pose.armR = PEEK_ARM_R;
    pose.curl = 0;
    pose.lidTopL = 34;
    pose.lidTopR = 34;
    pose.browL = { y: 9, rot: 6 };
    pose.browR = { y: 0, rot: 0 };
  }
  if (flags.snap) {
    pose.mouth = "o";
    pose.browL = { y: -12, rot: 0 };
    pose.browR = { y: -3, rot: 0 };
  }
  if (flags.whoa) {
    pose.armL = WHOA_ARM_L;
    pose.armR = WHOA_ARM_R;
    pose.curl = 0;
  }
  if (flags.happy) {
    pose.mouth = "grin";
    pose.lidLow = -52;
    pose.browL = { y: -8, rot: 0 };
    pose.browR = { y: -8, rot: 0 };
  }
  return pose;
}

/** Snap timeline (ms from submit), copied from the prototype. */
export const SNAP_TIMELINE = {
  whoaOn: 100,
  whoaOff: 560,
  happyOn: 660,
  snapOff: 1050,
  happyOff: 1500,
  /** Total duration of the split/click keyframes. */
  split: 1000,
} as const;

/**
 * Where the pupils look while typing: 0 = start of the field, 1 = its end.
 * Without a canvas to measure glyphs (native), a mean glyph width of
 * ~0.55 em is close enough for a gaze cue.
 */
export function caretProgress(
  caretIndex: number,
  fieldWidth: number,
  fontSize: number,
  meanGlyphEm = 0.55,
): number {
  if (fieldWidth <= 0 || fontSize <= 0) return 0;
  const usable = Math.max(1, fieldWidth - 34);
  const width = Math.max(0, caretIndex) * fontSize * meanGlyphEm;
  return Math.min(1, width / usable);
}

/** Pupil offset for a caret progress (−10 … +10 px across the eye). */
export function gazeForProgress(progress: number, y: number): { x: number; y: number } {
  const p = Math.min(1, Math.max(0, progress));
  return { x: -10 + 20 * p, y };
}

export function isEmailShapeValid(value: string): boolean {
  return /.+@.+\..+/.test(value);
}

export interface MascotPalette {
  /** The serious piece: ink on paper, paper on ink. */
  serious: string;
  eager: string;
  sclera: string;
  pupil: string;
  blush: string;
  /** Brows are cross-coloured: each wears the neighbour's colour. */
  browOnSerious: string;
  browOnEager: string;
  /** Hand rim so a hand reads against a piece of the same colour. */
  rimOnSerious: string;
  rimOnEager: string;
  spark: string;
  /** Drop shadow lifting the serious piece off a dark ground (0 = none). */
  seriousShadowOpacity: number;
}

// Shared with every brandmark via @patch-careers/tokens — the logo IS the
// mascot, so neither may drift from the other.
const EAGER = brandPieces.indigo;
const SCLERA = "#DDE3F5";
const PUPIL = "#151A30";

export function mascotPaletteFor(theme: ThemeName, success: string): MascotPalette {
  if (theme === "dark") {
    return {
      serious: brandPiecesDark.plain,
      eager: EAGER,
      sclera: SCLERA,
      pupil: PUPIL,
      blush: "#F4A0BE",
      browOnSerious: EAGER,
      browOnEager: "#FFFFFF",
      rimOnSerious: "#B9C2E0",
      rimOnEager: "#3B47B8",
      spark: success,
      seriousShadowOpacity: 0.45,
    };
  }
  return {
    serious: brandPieces.plain,
    eager: EAGER,
    sclera: SCLERA,
    pupil: PUPIL,
    blush: "#F9A8C4",
    browOnSerious: EAGER,
    browOnEager: "#000000",
    rimOnSerious: SCLERA,
    rimOnEager: "#3B47B8",
    spark: success,
    seriousShadowOpacity: 0,
  };
}

/** Finger fan: base x, splay angle, length — index → pinky. */
export const FINGERS = [
  { x: -13.5, angle: -4, length: 22, curlFactor: 1 },
  { x: -4.5, angle: -1, length: 27, curlFactor: 1.1 },
  { x: 4.5, angle: 2, length: 25, curlFactor: 1.05 },
  { x: 13.5, angle: 6, length: 19, curlFactor: 0.9 },
] as const;
export const THUMB_CURL_FACTOR = 0.4;

/** Tapered finger outline: 7.5 wide at the base, 6.5 at a round tip. */
export function fingerPath(length: number): string {
  const tip = -(length - 3.25);
  return `M -3.75 0 L -3.25 ${tip} A 3.25 3.25 0 0 1 3.25 ${tip} L 3.75 0 Z`;
}
