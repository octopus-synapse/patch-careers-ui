/**
 * `<Button>` — the canonical action component.
 *
 * Variants (`solid`/`outlined`/`ghost`) × intents
 * (`neutral`/`accent`/`danger`/`success`) × sizes (`sm`/`md`/`lg`) feed
 * the pure `resolveButtonStyle` resolver. Haptic feedback fires on press
 * via the `setHapticHandler` seam (no-op outside the app).
 */

import type { ReactNode } from "react";
import { resolveButtonStyle } from "../internal/button-variants";
import { hapticImpact } from "../internal/haptics";
import { TButton } from "../internal/tamagui-shim";
import type { ButtonVariant, Intent, Size } from "../internal/types";
import { useThemeName } from "../internal/use-theme-name";

export type ButtonProps = {
  variant?: ButtonVariant;
  intent?: Intent;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  onPress?: (event: unknown) => void;
  children?: ReactNode;
  /** Any additional Tamagui style prop pass-through. */
  [key: string]: unknown;
};

export function Button({
  variant = "solid",
  intent = "accent",
  size = "md",
  loading = false,
  disabled,
  onPress,
  children,
  ...rest
}: ButtonProps) {
  const themeName = useThemeName();
  const style = resolveButtonStyle(variant, intent, size, themeName);
  const isDisabled = disabled || loading;

  return (
    <TButton
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      backgroundColor={style.backgroundColor}
      color={style.color}
      borderColor={style.borderColor}
      borderWidth={style.borderWidth}
      paddingHorizontal={style.paddingHorizontal}
      paddingVertical={style.paddingVertical}
      borderRadius={style.borderRadius}
      fontSize={style.fontSize}
      minHeight={style.minHeight}
      opacity={isDisabled ? 0.5 : 1}
      disabled={isDisabled}
      onPress={(event: unknown) => {
        hapticImpact("light");
        onPress?.(event);
      }}
      {...rest}
    >
      {children}
    </TButton>
  );
}
