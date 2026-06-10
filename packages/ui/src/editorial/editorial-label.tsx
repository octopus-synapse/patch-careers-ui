/**
 * EditorialLabel — tiny uppercase tracked label above an input.
 */

import type { ReactElement, ReactNode } from "react";
import { resolveLabelColor } from "../internal/editorial-variants";
import { TText } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { editorialFonts } from "./fonts";

export function EditorialLabel({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <TText
      fontFamily={editorialFonts.sans}
      fontSize={10}
      letterSpacing={1.8}
      fontWeight="600"
      marginBottom={4}
      textTransform="uppercase"
      color={resolveLabelColor(editorialPalette, error)}
    >
      {children}
    </TText>
  );
}
