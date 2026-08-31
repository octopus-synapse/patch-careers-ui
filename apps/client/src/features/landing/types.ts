/**
 * Landing feature types — the chapter deck's vocabulary.
 *
 * The landing is a fixed sequence of full-screen chapters. A `ChapterSpec` is
 * everything the deck needs to drive one of them without knowing what it
 * renders: which accent tints it, which pose the mascot holds, and which i18n
 * group carries its copy.
 */

import type { LandingAccentKey } from "@patch-careers/tokens";

/** The 12 chapters, in page order. `ChapterKey` doubles as the URL hash. */
export type ChapterKey =
  | "hero"
  | "dor"
  | "robo"
  | "cena"
  | "vivo"
  | "vivo2"
  | "notas"
  | "notas2"
  | "auto"
  | "auto2"
  | "clique"
  | "cta";

/**
 * The mascot poses the landing drives, mirroring the prototype's `data-pet`.
 * Phase 1 only reads this off the spec; the mascot column consumes it later.
 */
export type MascotPoseKey = "talk" | "oops" | "covered" | "sealed" | "happy" | "snap";

export interface ChapterSpec {
  readonly key: ChapterKey;
  /** Tint for the emphasised clause, the glow and the active rail dot. */
  readonly accent: LandingAccentKey;
  /** Pose the mascot settles into while this chapter is on screen. */
  readonly pose: MascotPoseKey;
  /**
   * Counter shown big in this chapter, if any. Kept numeric (never copy) so
   * `Intl.NumberFormat` renders "7,4" in pt-BR and "7.4" in en for free.
   */
  readonly counter?: { readonly value: number; readonly fractionDigits: number };
}

/** Which way the deck is travelling — drives the layered reveal's direction. */
export type ChapterDirection = "down" | "up";
