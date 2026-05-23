/**
 * `<IconButton>` — square Button optimized for icon-only content.
 *
 * Re-uses `<Button>` styling but forces equal padding and exposes
 * `hitSlop` so the actual touch target meets WCAG 44pt regardless of
 * visual chrome.
 */

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./button";

export type IconButtonProps = ButtonProps & {
  /** Required for screen readers — the visible icon carries no semantic text. */
  accessibilityLabel: string;
  children: ReactNode;
};

export function IconButton({ accessibilityLabel, children, ...rest }: IconButtonProps) {
  return (
    <Button
      hitSlop={8}
      paddingHorizontal={12}
      paddingVertical={12}
      accessibilityLabel={accessibilityLabel}
      {...rest}
    >
      {children}
    </Button>
  );
}
