/**
 * Wordmark — typographic "Patch · CAREERS" (italic serif + tracked sans).
 */

import type { ReactElement } from "react";
import { TStack, TText, TXStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

export function Wordmark(): ReactElement {
  return (
    <TXStack alignItems="center" gap={8}>
      <TText
        fontFamily={editorialFonts.serif}
        fontStyle="italic"
        fontSize={18}
        color="$ink"
        fontWeight="400"
      >
        Patch
      </TText>
      <TStack width={3} height={3} borderRadius={2} backgroundColor="$inkMuted" />
      <TText
        fontFamily={editorialFonts.sans}
        fontSize={11}
        letterSpacing={2}
        color="$inkMuted"
        fontWeight="600"
      >
        CAREERS
      </TText>
    </TXStack>
  );
}
