import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, useWindowDimensions } from "react-native";
import { editorialFonts } from "../editorial/fonts";
import { TText, TXStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";

export type ModalHeaderProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  closeDisabled?: boolean;
  /** Use tighter title metrics on narrow screens while preserving desktop scale. */
  compactOnMobile?: boolean;
  /** Optional back control; occupies the same space as the close control. */
  leadingAction?: ReactNode;
};

/** Centered section heading with equal space on both sides for the close control. */
export function ModalHeader({
  title,
  closeLabel,
  onClose,
  closeDisabled = false,
  compactOnMobile = false,
  leadingAction,
}: ModalHeaderProps) {
  const palette = useEditorialPalette();
  const { width } = useWindowDimensions();
  const compact = compactOnMobile && width < 600;

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
        fontFamily={editorialFonts.serif}
        fontSize={compact ? 23 : 28}
        lineHeight={compact ? 28 : 34}
        letterSpacing={compact ? -0.6 : -1}
        fontWeight="700"
        fontStyle="normal"
        color={palette.ink}
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
          <X size={22} color={palette.muted} />
        </Pressable>
      </TXStack>
    </TXStack>
  );
}
