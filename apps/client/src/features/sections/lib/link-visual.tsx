/**
 * Leading visual for a links_v1 row, by LinkKind: brand glyphs for LinkedIn /
 * GitHub (simple-icons), lucide marks for Website / Portfolio, and a logo.dev
 * image (derived from the stored domain) for CUSTOM — degrading to a globe when
 * there's no key, no domain, or the image fails to load.
 */

import { Briefcase, Globe } from "lucide-react-native";
import type { ReactElement } from "react";
import { useState } from "react";
import { Image } from "react-native";
import { BrandGlyph } from "../components/brand-glyph";
import { companyLogoUrl } from "./company-logo";

export type LinkKind = "LINKEDIN" | "GITHUB" | "WEBSITE" | "PORTFOLIO" | "CUSTOM";

function CustomLinkLogo({
  domain,
  size,
  color,
}: {
  domain: string | null | undefined;
  size: number;
  color: string;
}): ReactElement {
  const [failed, setFailed] = useState(false);
  const url = domain ? companyLogoUrl(domain, size * 2) : undefined;
  if (!url || failed) return <Globe size={size} color={color} strokeWidth={1.75} />;
  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius: 4 }}
      onError={() => setFailed(true)}
      accessibilityIgnoresInvertColors
    />
  );
}

export function LinkLeading({
  kind,
  domain,
  size = 18,
  color,
}: {
  kind: LinkKind;
  domain?: string | null | undefined;
  size?: number;
  color: string;
}): ReactElement {
  switch (kind) {
    case "LINKEDIN":
      return <BrandGlyph brand="linkedin" size={size - 1} color={color} />;
    case "GITHUB":
      return <BrandGlyph brand="github" size={size - 1} color={color} />;
    case "PORTFOLIO":
      return <Briefcase size={size} color={color} strokeWidth={1.75} />;
    case "CUSTOM":
      return <CustomLinkLogo domain={domain} size={size} color={color} />;
    default:
      return <Globe size={size} color={color} strokeWidth={1.75} />;
  }
}
