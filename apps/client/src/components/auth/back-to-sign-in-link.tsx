/**
 * "Back to sign-in" — the link forgot-password, verify-email and 2fa-verify
 * share. Two shapes: the inline editorial caption inside the column
 * (native), and `corner`, an arrow + label meant for `AuthShell`'s top-left
 * slot on web, where a back affordance belongs at the screen edge.
 *
 * On verify-email the user is already signed in (sign-up logs in right
 * away so the session survives verification), and the `(auth)` layout
 * bounces any authenticated visitor straight back to verify-email — so
 * "back to sign-in" has to be a real sign-out first, or it is a no-op.
 */

import { logout } from "@patch-careers/auth";
import { Text, XStack } from "@patch-careers/ui";
import { editorialFonts, InlineLink, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { type ReactElement, useRef, useState } from "react";
import { Pressable } from "react-native";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useTranslator } from "@/providers/i18n-provider";

export function BackToSignInLink({
  testID,
  variant = "inline",
}: {
  testID?: string;
  variant?: "inline" | "corner";
}): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  const localized = useLocalizedHref();
  const palette = useEditorialPalette();
  const leaving = useRef(false);
  // Pointer feedback on web — hover events never fire on touch, so this is
  // desktop-only by nature.
  const [hovered, setHovered] = useState(false);
  const goBack = (): void => {
    if (leaving.current) return;
    leaving.current = true;
    // `logout()` never throws: it clears local tokens + store even when the
    // network call fails, which is exactly what lets sign-in render.
    void logout().finally(() => {
      leaving.current = false;
      router.replace(localized("/(auth)/sign-in"));
    });
  };

  if (variant === "corner") {
    return (
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        hitSlop={10}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        {...(testID ? { testID } : {})}
      >
        {({ pressed }) => (
          <XStack alignItems="center" gap={10} opacity={pressed ? 0.6 : hovered ? 0.8 : 1}>
            <ArrowLeft size={30} color={palette.ink} strokeWidth={1.75} />
            <Text fontFamily={editorialFonts.sans} fontSize={22} fontWeight="500" color="$ink">
              {t("common.back")}
            </Text>
          </XStack>
        )}
      </Pressable>
    );
  }

  return (
    <InlineLink
      label={t("common.back")}
      onPress={goBack}
      align="left"
      {...(testID ? { testID } : {})}
    />
  );
}
