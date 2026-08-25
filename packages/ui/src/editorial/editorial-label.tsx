/**
 * EditorialLabel — small sentence-case label above an input. (The all-caps
 * tracked treatment was dropped for a calmer, cleaner read.)
 */

import type { ReactElement, ReactNode } from "react";
import { Platform } from "react-native";
import { resolveLabelColor } from "../internal/editorial-variants";
import { TText } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { editorialFonts } from "./fonts";

export function EditorialLabel({
  children,
  error = false,
  active = false,
}: {
  children: ReactNode;
  error?: boolean;
  /** Field is focused — the label warms from body to ink. */
  active?: boolean;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <TText
      fontFamily={editorialFonts.sans}
      fontSize={Platform.OS === "web" ? 14 : 13}
      letterSpacing={0.1}
      fontWeight="500"
      marginBottom={4}
      color={resolveLabelColor(editorialPalette, error, active)}
      {...(Platform.OS === "web" ? { style: { transition: "color 180ms ease" } } : {})}
    >
      {children}
    </TText>
  );
}
