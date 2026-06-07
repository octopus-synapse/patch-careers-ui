/**
 * OAuthButton — ghost outlined provider button (icon + label).
 *
 * Icon-agnostic: the caller passes the brand glyph as `icon` (lucide-style
 * `{size,color,strokeWidth}` component). lucide-react-native ships no brand
 * icons, so the app supplies its own Github/LinkedIn marks.
 */

import { editorialPalette, radius } from "@patch-careers/tokens";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import { Icon, type LucideIconLike } from "../icons/icon";
import { resolveOAuthColors } from "../internal/editorial-variants";
import { TText, TXStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";
import { editorialFadeInDown } from "./motion";

export type OAuthButtonProps = {
  label: string;
  onPress: () => void;
  icon: LucideIconLike;
  disabled?: boolean;
  /** Stagger delay (ms) for the entering animation. */
  delay?: number;
  testID?: string;
};

const base = resolveOAuthColors(false);
const pressed = resolveOAuthColors(true);

export function OAuthButton({
  label,
  onPress,
  icon,
  disabled = false,
  delay = 700,
  testID,
}: OAuthButtonProps): ReactElement {
  return (
    <Animated.View entering={editorialFadeInDown(delay)}>
      <TXStack
        onPress={disabled ? undefined : onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        alignItems="center"
        justifyContent="center"
        gap={12}
        borderWidth={1}
        borderRadius={radius.full}
        paddingVertical={14}
        paddingHorizontal={20}
        minHeight={50}
        marginBottom={10}
        backgroundColor={base.backgroundColor}
        borderColor={base.borderColor}
        opacity={disabled ? 0.5 : 1}
        pressStyle={{ backgroundColor: pressed.backgroundColor, borderColor: pressed.borderColor }}
        {...(testID ? { testID } : {})}
      >
        <Icon as={icon} size={18} color={editorialPalette.ink} />
        <TText
          fontFamily={editorialFonts.sans}
          fontSize={14}
          color="$ink"
          fontWeight="500"
          letterSpacing={0.1}
        >
          {label}
        </TText>
      </TXStack>
    </Animated.View>
  );
}
