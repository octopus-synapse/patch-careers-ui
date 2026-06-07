/**
 * `<FAB>` — floating action button.
 *
 * Position-fixed bottom-right with `safeArea`-aware offset and a heavy
 * shadow elevation. The press haptic is inherited from `<Button>` (which
 * fires a light impact on every press) — the FAB does NOT re-wrap it, so
 * the haptic fires exactly once.
 */

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "../primitives/button";

export type FABProps = Omit<ButtonProps, "size" | "variant"> & {
  accessibilityLabel: string;
  children: ReactNode;
};

export function FAB({ accessibilityLabel, children, ...rest }: FABProps) {
  return (
    <Button
      position="absolute"
      bottom={24}
      right={24}
      width={56}
      height={56}
      borderRadius={28}
      paddingHorizontal={0}
      paddingVertical={0}
      alignItems="center"
      justifyContent="center"
      shadowColor="#000"
      shadowOpacity={0.2}
      shadowRadius={8}
      shadowOffset={{ width: 0, height: 4 }}
      intent="accent"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      elevation={6}
      {...rest}
    >
      {children}
    </Button>
  );
}
