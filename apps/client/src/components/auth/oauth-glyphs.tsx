/**
 * Brand glyphs for `<OAuthButton icon=...>`.
 *
 * `@patch-careers/ui/editorial` is icon-agnostic and lucide-react-native ships
 * no brand marks, so the app supplies its own. These adapt `@expo/vector-icons`
 * AntDesign to the lucide-style `{size,color}` component shape OAuthButton
 * expects.
 */

import { AntDesign } from "@expo/vector-icons";
import type { ReactElement } from "react";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };

export function GithubGlyph({ size, color }: GlyphProps): ReactElement {
  return <AntDesign name="github" size={size} color={color} />;
}

export function LinkedinGlyph({ size, color }: GlyphProps): ReactElement {
  return <AntDesign name="linkedin" size={size} color={color} />;
}
