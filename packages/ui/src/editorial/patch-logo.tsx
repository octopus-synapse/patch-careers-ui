/**
 * PatchLogo — the brand lockup: a two-piece jigsaw mark + "PATCH / CAREERS".
 *
 * Replaces the old typographic wordmark. The mark is `react-native-svg`
 * (SVG fills take raw hex, so they read straight from the editorial palette:
 * blue = accent, ink = primary); the text stays Tamagui so it themes with
 * the rest of the editorial type. Scale the whole lockup via `size` (the
 * mark's px size; the text scales relative to it).
 */

import { editorialPalette } from "@patch-careers/tokens";
import { type ReactElement, useId } from "react";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { TText, TXStack, TYStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

export function PatchLogo({ size = 34 }: { size?: number }): ReactElement {
  // Sanitize useId() (may contain ':') into a valid SVG id / url() reference.
  const clipId = `patchLogo-${useId().replace(/:/g, "")}`;
  return (
    <TXStack alignItems="center" gap={size * 0.32}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <ClipPath id={clipId}>
            <Rect x={2} y={2} width={96} height={96} rx={22} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          {/* Blue piece (top) — bottom edge carries the jigsaw socket. */}
          <Path
            fill={editorialPalette.accent}
            d="M0 0 H100 V48 H62 C70 40 66 18 50 18 C34 18 30 40 38 48 H0 Z"
          />
          {/* Ink piece (bottom) — top edge carries the matching jigsaw tab. */}
          <Path
            fill={editorialPalette.primary}
            d="M0 52 H38 C30 44 34 22 50 22 C66 22 70 44 62 52 H100 V100 H0 Z"
          />
        </G>
      </Svg>
      <TYStack>
        <TText
          fontFamily={editorialFonts.sans}
          fontSize={size * 0.6}
          lineHeight={size * 0.64}
          letterSpacing={-0.5}
          fontWeight="700"
          color="$ink"
        >
          PATCH
        </TText>
        <TText
          fontFamily={editorialFonts.sans}
          fontSize={size * 0.235}
          letterSpacing={size * 0.13}
          fontWeight="600"
          color="$inkMuted"
        >
          CAREERS
        </TText>
      </TYStack>
    </TXStack>
  );
}
