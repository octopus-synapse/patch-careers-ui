/**
 * `<Divider>` — thin separator line, horizontal or vertical.
 */

import { TStack } from "../internal/tamagui-shim";

export type DividerProps = {
  vertical?: boolean;
  color?: string;
  /** Inset from the start edge (horizontal divider) — e.g. to clear a leading avatar. */
  marginLeft?: number;
  /** Inset from the end edge (horizontal divider). */
  marginRight?: number;
};

export function Divider({
  vertical = false,
  color = "$gray5",
  marginLeft,
  marginRight,
}: DividerProps) {
  return (
    <TStack
      backgroundColor={color}
      width={vertical ? 1 : "100%"}
      height={vertical ? "100%" : 1}
      {...(marginLeft !== undefined ? { marginLeft } : {})}
      {...(marginRight !== undefined ? { marginRight } : {})}
      accessibilityRole="none"
    />
  );
}
