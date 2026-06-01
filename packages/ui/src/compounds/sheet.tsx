/**
 * `<Sheet>` — bottom sheet with handle, snap points and backdrop.
 *
 * Wraps `@tamagui/sheet` with patch-careers defaults. We tag the import
 * `as unknown as ...` to relax Tamagui's tight generic surface (the
 * package is loaded for its runtime, not its TS types).
 */

import { Sheet as TamaguiSheet } from "@tamagui/sheet";
import type { ComponentType, ReactNode } from "react";

type LooseProps = Record<string, unknown> & { children?: ReactNode };
type SheetCompound = ComponentType<LooseProps> & {
  Overlay: ComponentType<LooseProps>;
  Handle: ComponentType<LooseProps>;
  Frame: ComponentType<LooseProps>;
};

const TSheet = TamaguiSheet as unknown as SheetCompound;

export type SheetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Default snap points (% of screen). */
  snapPoints?: number[];
  children?: ReactNode;
};

export function Sheet({ snapPoints = [85, 50, 25], children, ...rest }: SheetProps) {
  return (
    <TSheet
      modal
      dismissOnSnapToBottom
      snapPoints={snapPoints}
      animation="medium"
      {...(rest as LooseProps)}
    >
      <TSheet.Overlay animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <TSheet.Handle />
      <TSheet.Frame padding={16}>{children}</TSheet.Frame>
    </TSheet>
  );
}

export { TSheet as SheetRoot };
