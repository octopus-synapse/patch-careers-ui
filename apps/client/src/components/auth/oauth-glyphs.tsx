/**
 * Brand glyphs for `<OAuthButton icon=...>`.
 *
 * `@patch-careers/ui/editorial` is icon-agnostic and lucide-react-native ships
 * no brand marks, so the app supplies its own. These adapt `@expo/vector-icons`
 * AntDesign to the lucide-style `{size,color}` component shape OAuthButton
 * expects.
 */

import { AntDesign, FontAwesome } from "@expo/vector-icons";
import type { ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };

// Official brand marks keep their own colors, ignoring the theme ink — these
// are not design tokens.
// @style-allow color: official LinkedIn brand blue (brand mark, not a theme token)
const LINKEDIN_BLUE = "#0A66C2";
// @style-allow color: official Google "G" brand palette (brand mark, not theme tokens)
const GOOGLE = { red: "#EA4335", blue: "#4285F4", yellow: "#FBBC05", green: "#34A853" } as const;

export function GithubGlyph({ size, color }: GlyphProps): ReactElement {
  return <AntDesign name="github" size={size} color={color} />;
}

export function LinkedinGlyph({ size }: GlyphProps): ReactElement {
  // `linkedin-square` is the solid filled mark (blue square, cut-out "in");
  // AntDesign's `linkedin` is a thin outline, so we use FontAwesome here.
  return <FontAwesome name="linkedin-square" size={size} color={LINKEDIN_BLUE} />;
}

export function GoogleGlyph({ size = 18 }: GlyphProps): ReactElement {
  // Official multicolor Google "G" — a brand mark, so it ignores the theme ink.
  // AntDesign ships only a monochrome glyph, hence the inline SVG.
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill={GOOGLE.red}
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill={GOOGLE.blue}
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill={GOOGLE.yellow}
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill={GOOGLE.green}
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}
