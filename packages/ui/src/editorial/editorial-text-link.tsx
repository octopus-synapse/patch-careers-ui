/**
 * EditorialTextLink — the inline "$accentBlue underlined" link recipe used
 * inside body copy (consent terms/privacy) and wrapped by `InlineLink` for
 * the block-positioned variant.
 */

import type { ReactElement } from "react";
import { TText } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { editorialFonts } from "./fonts";

export type EditorialTextLinkProps = {
  label: string;
  onPress: () => void;
  fontSize?: number;
  testID?: string;
};

export function EditorialTextLink({
  label,
  onPress,
  fontSize,
  testID,
}: EditorialTextLinkProps): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <TText
      onPress={onPress}
      accessibilityRole="link"
      cursor="pointer"
      fontFamily={editorialFonts.sans}
      color="$accentBlue"
      fontWeight="500"
      textDecorationLine="underline"
      textDecorationColor={editorialPalette.accent}
      {...(fontSize !== undefined ? { fontSize } : {})}
      {...(testID ? { testID } : {})}
    >
      {label}
    </TText>
  );
}
