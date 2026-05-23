/**
 * `<FAB>` — floating action button.
 *
 * Position-fixed bottom-right with `safeArea`-aware offset and a heavy
 * shadow elevation. Auto-pulses a light haptic on press.
 */

import type { ReactNode } from "react";
import { hapticImpact } from "../internal/haptics";
import { Button, type ButtonProps } from "../primitives/button";

export type FABProps = Omit<ButtonProps, "size" | "variant"> & {
  accessibilityLabel: string;
  children: ReactNode;
};

export function FAB({ accessibilityLabel, onPress, children, ...rest }: FABProps) {
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
      elevation={6}
      intent="accent"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={(event: unknown) => {
        hapticImpact("light");
        (onPress as ((e: unknown) => void) | undefined)?.(event);
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}
