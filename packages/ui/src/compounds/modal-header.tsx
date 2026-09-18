import { authDialogPalette } from "@patch-careers/tokens";
import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { editorialFonts } from "../editorial/fonts";
import { TText, TXStack } from "../internal/tamagui-shim";
import { useThemeName } from "../internal/use-theme-name";

export type ModalHeaderProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  closeDisabled?: boolean;
  /** Optional back control; occupies the same space as the close control. */
  leadingAction?: ReactNode;
};

/** Centered section heading with equal space on both sides for the close control. */
export function ModalHeader({
  title,
  closeLabel,
  onClose,
  closeDisabled = false,
  leadingAction,
}: ModalHeaderProps) {
  const dialogPalette = authDialogPalette[useThemeName()];

  return (
    <TXStack position="relative" justifyContent="center" paddingHorizontal={34}>
      {leadingAction ? (
        <TXStack position="absolute" top={6} left={0}>
          {leadingAction}
        </TXStack>
      ) : null}
      <TText
        accessibilityRole="header"
        flex={1}
        textAlign="center"
        fontFamily={editorialFonts.sans}
        fontSize={28}
        lineHeight={34}
        letterSpacing={-1}
        fontWeight="600"
        fontStyle="normal"
        color={dialogPalette.brand}
      >
        {title}
      </TText>
      <TXStack position="absolute" top={6} right={0}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          hitSlop={12}
          disabled={closeDisabled}
          onPress={onClose}
        >
          <X size={22} color={dialogPalette.muted} />
        </Pressable>
      </TXStack>
    </TXStack>
  );
}
