/**
 * `HeroInput` — the hero's "paste a job" box: input + dark pill CTA, in one
 * rounded white bar, exactly the prototype's arrangement. Both roads lead to
 * sign-up: the landing's promise is that the result comes before the account,
 * and the account is where the result lives.
 */

import { shadows } from "@patch-careers/tokens";
import { Text, XStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { Pressable, TextInput } from "react-native";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useI18n } from "@/providers/i18n-provider";
import { landingSans } from "../lib/landing-fonts";

export function HeroInput(): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const router = useRouter();
  const localized = useLocalizedHref();
  const [value, setValue] = useState("");

  const submit = (): void => {
    router.push(localized("/(auth)/sign-up"));
  };

  return (
    <XStack
      backgroundColor={palette.panel}
      borderRadius={16}
      borderWidth={1}
      borderColor={palette.hairline}
      padding={8}
      gap={8}
      alignItems="center"
      maxWidth={576}
      shadowColor={shadows.md.mobile.shadowColor}
      shadowOpacity={shadows.md.mobile.shadowOpacity}
      shadowRadius={shadows.md.mobile.shadowRadius}
      shadowOffset={shadows.md.mobile.shadowOffset}
    >
      <TextInput
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        placeholder={t("landing.chapters.hero.inputPlaceholder")}
        placeholderTextColor={palette.subtle}
        style={{
          flex: 1,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 14,
          fontFamily: landingSans,
          color: palette.ink,
        }}
      />
      <Pressable onPress={submit} accessibilityRole="button">
        <XStack
          backgroundColor={palette.primary}
          borderRadius={999}
          paddingHorizontal={20}
          paddingVertical={12}
        >
          <Text fontFamily={landingSans} fontSize={14} fontWeight="600" color={palette.onPrimary}>
            {`${t("landing.chapters.hero.cta")} →`}
          </Text>
        </XStack>
      </Pressable>
    </XStack>
  );
}
