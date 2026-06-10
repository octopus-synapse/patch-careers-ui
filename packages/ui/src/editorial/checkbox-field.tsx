/**
 * CheckboxField — square checkbox + a plain text label.
 *
 * The link-bearing variant is `ConsentCheckbox`; this one is for simple
 * boolean options ("Remember me" / "Keep me signed in"). Router-agnostic:
 * the caller owns the state via `checked` + `onToggle`.
 */

import { Check } from "lucide-react-native";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import { Icon } from "../icons/icon";
import { resolveConsentBoxColors } from "../internal/editorial-variants";
import { TStack, TText, TXStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { editorialFonts } from "./fonts";
import { editorialFadeInDown } from "./motion";

export type CheckboxFieldProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  /** Stagger delay (ms) for the entering animation. */
  delay?: number;
  testID?: string;
};

export function CheckboxField({
  checked,
  onToggle,
  label,
  delay = 350,
  testID,
}: CheckboxFieldProps): ReactElement {
  const editorialPalette = useEditorialPalette();
  const box = resolveConsentBoxColors(editorialPalette, checked, false);
  return (
    <Animated.View entering={editorialFadeInDown(delay)}>
      <TXStack
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        alignItems="center"
        gap={10}
        cursor="pointer"
        {...(testID ? { testID } : {})}
      >
        <TStack
          width={18}
          height={18}
          borderRadius={3}
          borderWidth={1.5}
          alignItems="center"
          justifyContent="center"
          backgroundColor={box.backgroundColor}
          borderColor={box.borderColor}
        >
          {checked ? (
            <Icon as={Check} size={12} color={editorialPalette.onPrimary} strokeWidth={3} />
          ) : null}
        </TStack>
        <TText fontFamily={editorialFonts.sans} fontSize={13} color="$inkBody">
          {label}
        </TText>
      </TXStack>
    </Animated.View>
  );
}
