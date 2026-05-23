/**
 * `<Divider>` — thin separator line, horizontal or vertical.
 */

import { TStack } from "../internal/tamagui-shim";

export type DividerProps = {
  vertical?: boolean;
  color?: string;
};

export function Divider({ vertical = false, color = "$gray5" }: DividerProps) {
  return (
    <TStack
      backgroundColor={color}
      width={vertical ? 1 : "100%"}
      height={vertical ? "100%" : 1}
      accessibilityRole="none"
    />
  );
}
