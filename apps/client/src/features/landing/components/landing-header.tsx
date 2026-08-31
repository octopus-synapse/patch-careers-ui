/**
 * `LandingHeader` — brand mark left, the two ways in on the right.
 *
 * Edge to edge rather than inside the content column: the landing is the one
 * screen that isn't a document, so the chrome hugs the window.
 */

import { Text, XStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { landingSans } from "../lib/landing-fonts";
import { BrandFace } from "./brand-face";

const HEADER_HEIGHT = 76;

export function LandingHeader(): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const router = useRouter();

  return (
    <XStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      height={HEADER_HEIGHT}
      zIndex={40}
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal={28}
    >
      <Pressable onPress={() => router.push("/")} accessibilityRole="link">
        <BrandFace height={54} />
      </Pressable>

      <XStack alignItems="center" gap={20}>
        <Pressable onPress={() => router.push("/(auth)/sign-in")} accessibilityRole="link">
          <Text fontFamily={landingSans} fontSize={15} color={palette.muted}>
            {t("landing.header.signIn")}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(auth)/sign-up")} accessibilityRole="button">
          <XStack
            backgroundColor={palette.primary}
            borderRadius={999}
            paddingHorizontal={20}
            paddingVertical={10}
          >
            <Text fontFamily={landingSans} fontSize={15} fontWeight="600" color={palette.onPrimary}>
              {t("landing.header.signUp")}
            </Text>
          </XStack>
        </Pressable>
      </XStack>
    </XStack>
  );
}
