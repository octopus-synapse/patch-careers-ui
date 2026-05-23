/**
 * `<Text>` — typography primitive bound to `@patch-careers/tokens`.
 *
 * Wraps Tamagui's `Text` to expose semantic presets (`h1`, `body`, …)
 * resolved via `resolveTextStyle`. Falls back to `body` when no preset
 * is supplied.
 */

import type { ReactNode } from "react";
import { TText } from "../internal/tamagui-shim";
import { resolveTextStyle, type TextPreset } from "../internal/text-variants";

export type TextProps = {
  preset?: TextPreset;
  children?: ReactNode;
  [key: string]: unknown;
};

export function Text({ preset = "body", ...rest }: TextProps) {
  const style = resolveTextStyle(preset);
  return (
    <TText
      fontSize={style.fontSize}
      lineHeight={style.lineHeight}
      fontWeight={style.fontWeight}
      letterSpacing={style.letterSpacing}
      {...rest}
    />
  );
}
