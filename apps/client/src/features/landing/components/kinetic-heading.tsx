import { Text } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import type { KineticHeadingProps } from "./kinetic-heading.types";

export function KineticHeading({
  lead,
  second,
  emphasis,
  tail,
  accent,
  size,
  maxWidth = 900,
  centered = false,
  breakAfterLead = false,
}: KineticHeadingProps): ReactElement {
  const palette = useEditorialPalette();
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
