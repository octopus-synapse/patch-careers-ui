/**
 * `BrandFace` — the navbar brandmark with the mascot's face on it, straight
 * from the prototype's "a logo é o mascote": the two puzzle pieces with big
 * round eyes (pupils that follow the cursor on web) and a little smile.
 *
 * Since it IS the mascot, the pieces come from the same shared palette the
 * mascot uses. They used to come from the landing accents, whose dark values
 * (#F5F5F0 warm ivory, #8C97FF washed periwinkle) had drifted well away from
 * the mascot's pure white and brand indigo.
 */

import { brandPiecePalettes } from "@patch-careers/tokens";
import { useThemeName } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useLandingBrandFace } from "../hooks/use-landing-palettes";

const PIECE_DARK =
  "M 20 0 H 135 V 66 H 149 A 22 22 0 1 1 149 94 H 135 V 157.9 A 42 42 0 1 0 95 228.5 V 282 A 8 8 0 0 1 87 290 H 20 A 20 20 0 0 1 0 270 V 20 A 20 20 0 0 1 20 0 Z";
const PIECE_BLUE =
  "M 153 23 H 256 A 24 24 0 0 1 280 47 V 163 A 22 22 0 0 0 280 207 V 266 A 24 24 0 0 1 256 290 H 115 A 8 8 0 0 1 107 282 V 224 A 8 8 0 0 0 98 217 A 30 30 0 1 1 128 168 A 11 11 0 0 0 147 160 V 108.2 A 34 34 0 1 0 147 51.8 V 29 A 6 6 0 0 1 153 23 Z";

export interface BrandFaceProps {
  readonly height?: number;
}

export function BrandFace({ height = 54 }: BrandFaceProps): ReactElement {
  const pieces = brandPiecePalettes[useThemeName()];
  const face = useLandingBrandFace();
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const frame = useRef(0);

  // The demo's pupils track the cursor (±10px x, ±8px y around the mark).
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onMove = (event: MouseEvent): void => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const cx = 55;
        const cy = 40;
        const dx = Math.max(-1, Math.min(1, (event.clientX - cx) / 600));
        const dy = Math.max(-1, Math.min(1, (event.clientY - cy) / 400));
        setPupil({ x: dx * 10, y: dy * 8 });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const width = (height / 290) * 280;
  return (
    <Svg width={width} height={height} viewBox="0 0 280 290" aria-hidden>
      <Path d={PIECE_DARK} fill={pieces.plain} />
      <Path d={PIECE_BLUE} fill={pieces.indigo} />
      <G x={78} y={110}>
        <Circle r={30} fill={face.sclera} />
        <G x={pupil.x} y={pupil.y}>
          <Circle r={15} fill={face.pupil} />
          <Circle cx={7} cy={-8} r={5} fill={face.highlight} />
        </G>
      </G>
      <G x={212} y={110}>
        <Circle r={30} fill={face.sclera} />
        <G x={pupil.x} y={pupil.y}>
          <Circle r={15} fill={face.pupil} />
          <Circle cx={7} cy={-8} r={5} fill={face.highlight} />
        </G>
      </G>
      <Path
        d="M146 168 Q162 184 178 168"
        fill="none"
        stroke={face.pupil}
        strokeWidth={9}
        strokeLinecap="round"
      />
    </Svg>
  );
}
