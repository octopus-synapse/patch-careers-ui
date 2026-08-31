/**
 * The landing's typographic building blocks.
 *
 * Every chapter is the same four shapes — an oversized serif heading whose
 * emphasised clause carries the chapter's accent, a muted paragraph, an
 * occasional huge number, and a mono source line — so they live here once and
 * the chapter files stay about content.
 */

import { Text, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import { landingSans } from "../lib/landing-fonts";

/**
 * The prototype's four heading scales (Tailwind's md: sizes): the hero's 84,
 * the chapters' 72, the dor stat-heading's 60, and the interactive demos' 48 —
 * each stepping down with the viewport.
 */
export type HeadingVariant = "hero" | "chapter" | "stat" | "demo";

const HEADING_SIZES: Record<HeadingVariant, readonly [number, number, number, number]> = {
  hero: [84, 68, 52, 40],
  chapter: [72, 60, 46, 34],
  stat: [60, 52, 40, 32],
  demo: [48, 44, 36, 30],
};

function headingSize(width: number, variant: HeadingVariant): number {
  const [xl, lg, md, sm] = HEADING_SIZES[variant];
  if (width >= 1280) return xl;
  if (width >= 1024) return lg;
  if (width >= 640) return md;
  return sm;
}

export interface ChapterHeadingProps {
  readonly lead?: string;
  readonly second?: string;
  readonly emphasis?: string;
  readonly tail?: string;
  readonly accent: string;
  readonly width: number;
  readonly maxWidth?: number;
  readonly variant?: HeadingVariant;
  /** Force a line break after `lead` — the hero's two-sentence opening. */
  readonly breakAfterLead?: boolean;
  readonly centered?: boolean;
}

/**
 * The chapter headline. The emphasised clause is a separate run in italic serif
 * and the chapter's accent — never markup through `t()`.
 */
export function ChapterHeading({
  lead,
  second,
  emphasis,
  tail,
  accent,
  width,
  maxWidth = 900,
  variant = "chapter",
  breakAfterLead = false,
  centered = false,
}: ChapterHeadingProps): ReactElement {
  const palette = useEditorialPalette();
  const size = headingSize(width, variant);
  return (
    <Text
      fontFamily={editorialFonts.serif}
      fontSize={size}
      lineHeight={size * 1.02}
      textAlign={centered ? "center" : "left"}
      letterSpacing={-size * 0.012}
      color={palette.ink}
      fontWeight="400"
      maxWidth={maxWidth}
    >
      {lead ? (breakAfterLead ? `${lead}\n` : `${lead} `) : null}
      {second ? `${second} ` : null}
      {emphasis ? (
        <Text fontStyle="italic" color={accent} fontFamily={editorialFonts.serif} fontSize={size}>
          {emphasis}
        </Text>
      ) : null}
      {tail ? ` ${tail}` : null}
    </Text>
  );
}

export interface ChapterParagraphProps {
  readonly children: ReactNode;
  readonly maxWidth?: number;
  readonly size?: number;
  readonly centered?: boolean;
}

/**
 * Inline runs (`Emphasis`, `UnderlinedEmphasis`) must render at their host
 * paragraph's size — a nested Tamagui `Text` doesn't inherit `fontSize`, it
 * falls back to the 14px default, which shrank every bold span in the page.
 */
const ParagraphSizeContext = createContext(19);

export function ChapterParagraph({
  children,
  maxWidth = 620,
  size = 19,
  centered = false,
}: ChapterParagraphProps): ReactElement {
  const palette = useEditorialPalette();
  return (
    <ParagraphSizeContext.Provider value={size}>
      <Text
        fontFamily={landingSans}
        fontSize={size}
        lineHeight={size * 1.5}
        color={palette.muted}
        maxWidth={maxWidth}
        textAlign={centered ? "center" : "left"}
      >
        {children}
      </Text>
    </ParagraphSizeContext.Provider>
  );
}

/** An emphasised run inside a paragraph — ink, not accent, so it reads as weight. */
export function Emphasis({ children }: { readonly children: ReactNode }): ReactElement {
  const palette = useEditorialPalette();
  const size = useContext(ParagraphSizeContext);
  return (
    <Text
      fontFamily={landingSans}
      fontWeight="600"
      fontSize={size}
      lineHeight={size * 1.5}
      color={palette.ink}
    >
      {children}
    </Text>
  );
}

/**
 * The prototype's thick coloured underline (the blue "5 segundos", the mint
 * "um currículo"). RN can't thicken a text-decoration, so the run is bold ink
 * with the accent as decoration colour — the closest faithful read.
 */
export function UnderlinedEmphasis({
  children,
  color,
}: {
  readonly children: ReactNode;
  readonly color: string;
}): ReactElement {
  const palette = useEditorialPalette();
  const size = useContext(ParagraphSizeContext);
  // The demo's `.underline-brand` is a 4px painted bar, not a text-decoration;
  // an inline border reproduces it on web (the landing's only platform).
  return (
    <Text
      fontFamily={landingSans}
      fontWeight="600"
      fontSize={size}
      lineHeight={size * 1.5}
      color={palette.ink}
      borderBottomWidth={4}
      borderBottomColor={color}
      paddingBottom={3}
      whiteSpace="nowrap"
    >
      {children}
    </Text>
  );
}

/** The mono citation line under a claim. */
export function Sources({ children }: { readonly children: ReactNode }): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Text
      fontFamily={editorialFonts.mono}
      fontSize={11}
      lineHeight={17}
      color={palette.subtle}
      maxWidth={860}
    >
      {children}
    </Text>
  );
}

export interface BigNumberProps {
  readonly value: string;
  readonly unit?: string;
  readonly accent: string;
  readonly width: number;
  /** `big` is dor's 200px `.big`; `inline` is robo's 96px stat beside its caption. */
  readonly variant?: "big" | "inline";
}

/** The chapter-defining number: 7,4s · 68% — the object closest to the camera. */
export function BigNumber({
  value,
  unit,
  accent,
  width,
  variant = "big",
}: BigNumberProps): ReactElement {
  const palette = useEditorialPalette();
  const size =
    variant === "big"
      ? width >= 1280
        ? 200
        : width >= 1024
          ? 150
          : width >= 640
            ? 112
            : 88
      : width >= 1280
        ? 96
        : width >= 1024
          ? 76
          : 60;
  return (
    <Text
      fontFamily={editorialFonts.serif}
      fontSize={size}
      lineHeight={size * 0.92}
      letterSpacing={-size * 0.03}
      color={palette.ink}
      fontWeight="400"
    >
      {value}
      {/* Nested rather than a sibling so the unit sits on the number's
          baseline instead of floating at its cap height. */}
      {unit ? (
        <Text
          fontFamily={editorialFonts.serif}
          fontSize={size * 0.42}
          color={accent}
          fontWeight="400"
        >
          {unit}
        </Text>
      ) : null}
    </Text>
  );
}

/** Small caps-free eyebrow above a heading. */
export function Eyebrow({
  children,
  accent,
}: {
  readonly children: ReactNode;
  readonly accent: string;
}): ReactElement {
  return (
    <Text fontFamily={landingSans} fontSize={14} fontWeight="500" color={accent}>
      {children}
    </Text>
  );
}

/** Vertical rhythm wrapper so every chapter breathes the same way. */
export function ChapterStack({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <YStack gap={20} maxWidth={980}>
      {children}
    </YStack>
  );
}
