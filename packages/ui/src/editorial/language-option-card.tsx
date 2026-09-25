/**
 * Shared language choice used by onboarding and the first-visit language dialog.
 *
 * The caller owns the copy and selected state; this component owns the common
 * plan-card shape so both entry points keep the same selection affordance.
 */

import { authDialogPalette } from "@patch-careers/tokens";
import { Check } from "lucide-react-native";
import type { ReactElement } from "react";
import { Icon } from "../icons/icon";
import { TStack, TText, TXStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts } from "./fonts";

export type LanguageOptionCardProps = {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  size?: "default" | "large";
  accessibilityLabel?: string;
  labelColor?: string;
  descriptionColor?: string;
  testID?: string;
};

export function LanguageOptionCard({
  label,
  description,
  selected,
  onPress,
  size = "default",
  accessibilityLabel,
  labelColor,
  descriptionColor,
  testID,
}: LanguageOptionCardProps): ReactElement {
  const palette = useEditorialPalette();
  const dialog = authDialogPalette[useThemeName()];
  const large = size === "large";

  return (
    <TXStack
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      testID={testID}
      width="100%"
      height={large ? 104 : 78}
      alignItems="center"
      justifyContent="space-between"
      gap={12}
      borderWidth={selected ? 2 : 1}
      borderColor={selected ? dialog.brand : dialog.inputBorder}
      borderRadius={16}
      paddingHorizontal={large ? 24 : 20}
      backgroundColor={selected ? dialog.selected : dialog.input}
      cursor="pointer"
      hoverStyle={{ opacity: 0.88 }}
      pressStyle={{ opacity: 0.76 }}
    >
      <TStack flex={1} gap={3}>
        <TText
          fontFamily={editorialFonts.sans}
          fontSize={17}
          fontWeight="600"
          color={labelColor ?? palette.ink}
        >
          {label}
        </TText>
        <TText
          fontFamily={editorialFonts.sans}
          fontSize={12.5}
          lineHeight={17}
          color={descriptionColor ?? palette.muted}
        >
          {description}
        </TText>
      </TStack>

      <TStack
        width={24}
        height={24}
        borderRadius={12}
        borderWidth={selected ? 0 : 1}
        borderColor={dialog.inputBorder}
        alignItems="center"
        justifyContent="center"
        backgroundColor={selected ? dialog.brand : "transparent"}
      >
        {selected ? <Icon as={Check} size={15} color={dialog.panel} strokeWidth={3} /> : null}
      </TStack>
    </TXStack>
  );
}
