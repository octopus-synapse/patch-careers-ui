/**
 * ConsentCheckbox — square checkbox + inline Terms/Privacy links.
 *
 * Router-agnostic: the inline links call `onTermsPress` / `onPrivacyPress`.
 */

import { Check } from "lucide-react-native";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import { Icon } from "../icons/icon";
import { resolveConsentBoxColors } from "../internal/editorial-variants";
import { TStack, TText, TXStack, TYStack } from "../internal/tamagui-shim";
import { EditorialTextLink } from "./editorial-text-link";
import { editorialFonts } from "./fonts";
import { editorialFadeInDown } from "./motion";

export type ConsentCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  intro: string;
  termsLabel: string;
  onTermsPress: () => void;
  conjunction: string;
  privacyLabel: string;
  onPrivacyPress: () => void;
  error?: string;
  testID?: string;
};

export function ConsentCheckbox({
  checked,
  onToggle,
  intro,
  termsLabel,
  onTermsPress,
  conjunction,
  privacyLabel,
  onPrivacyPress,
  error,
  testID,
}: ConsentCheckboxProps): ReactElement {
  const box = resolveConsentBoxColors(checked, !!error);
  return (
    <Animated.View entering={editorialFadeInDown(350)}>
      <TXStack
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        alignItems="flex-start"
        gap={12}
        marginTop={8}
        {...(testID ? { testID } : {})}
      >
        <TStack
          width={18}
          height={18}
          borderRadius={3}
          borderWidth={1.5}
          alignItems="center"
          justifyContent="center"
          marginTop={2}
          backgroundColor={box.backgroundColor}
          borderColor={box.borderColor}
        >
          {checked ? <Icon as={Check} size={12} color="#FFFFFF" strokeWidth={3} /> : null}
        </TStack>
        <TYStack flex={1}>
          <TText fontFamily={editorialFonts.sans} fontSize={13} color="$inkBody" lineHeight={20}>
            {intro} <EditorialTextLink label={termsLabel} onPress={onTermsPress} />
            <TText>{` ${conjunction} `}</TText>
            <EditorialTextLink label={privacyLabel} onPress={onPrivacyPress} />.
          </TText>
          {error ? (
            <TText
              fontFamily={editorialFonts.mono}
              fontSize={11}
              color="$editorialDanger"
              marginTop={6}
              letterSpacing={0.4}
            >
              {error}
            </TText>
          ) : null}
        </TYStack>
      </TXStack>
    </Animated.View>
  );
}
