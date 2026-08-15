/**
 * EditorialLabel — small sentence-case label above an input. (The all-caps
 * tracked treatment was dropped for a calmer, cleaner read.)
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
      fontSize={13}
      letterSpacing={0.2}
      fontWeight="500"
      marginBottom={4}
      color={resolveLabelColor(editorialPalette, error)}
    >
      {children}
    </TText>
  );
}
