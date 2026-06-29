/**
 * `SettingsScreenShell` — standalone screen frame (slim back bar + centered
 * serif title + scroll body) shared by the settings routes and the Profile tab.
 *
 * App-local (not `@patch-careers/ui`) on purpose: it owns the back navigation,
 * so it is coupled to expo-router + the app's i18n provider (ARCHITECTURE.md
 * §3.1 — reused but app-coupled → `components/`). Promoted here out of the
 * settings feature so the Profile tab can reuse it without a cross-feature
 * import (ADR-0010). The pure surface/row live in `@patch-careers/ui`.
 */
import { Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/providers/i18n-provider";

export function SettingsScreenShell({
  title,
  children,
  scroll = true,
}: {
  title: string;
  children: ReactNode;
  /** Set false when the screen renders its own list/scroll (e.g. FlatList). */
  scroll?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();

  const goBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  };

  const header = (
    <XStack alignItems="center" height={48} paddingHorizontal={8}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        onPress={goBack}
        hitSlop={8}
      >
        <YStack width={38} height={38} alignItems="center" justifyContent="center">
          <Icon as={ChevronLeft} size={26} color={palette.ink} />
        </YStack>
      </Pressable>
      <Text
        flex={1}
        textAlign="center"
        fontFamily={editorialFonts.serif}
        fontSize={22}
        color={palette.ink}
      >
        {title}
      </Text>
      <YStack width={38} height={38} />
    </XStack>
  );

  return (
    <YStack flex={1} backgroundColor={palette.bg} paddingTop={insets.top}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            gap: 8,
            paddingBottom: insets.bottom + 28,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <YStack flex={1}>{children}</YStack>
      )}
    </YStack>
  );
}
