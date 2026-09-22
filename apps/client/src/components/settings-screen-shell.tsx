import { useAppRouter } from "@/navigation/use-app-router";
import { withoutLocale } from "@/navigation/route-locale";
/**
 * `SettingsScreenShell` — standalone screen frame (slim back bar + centered
 * serif title + scroll body) shared by the settings routes and the Profile tab.
 *
 * App-local (not `@patch-careers/ui`) on purpose: it owns the back navigation,
 * so it is coupled to expo-router + the app's i18n provider (ARCHITECTURE.md
 * §3.1 — reused but app-coupled → `components/`). Promoted here out of the
 * settings feature so the Profile tab can reuse it without a cross-feature
 * import (ADR-0010). The pure surface/row live in `@patch-careers/ui`.
 *
 * On desktop web (≥1024), settings DRILL-DOWNS (change e-mail, 2FA, blocked…)
 * swap the stacked mobile frame for a pane beside the same rail the single page
 * wears, so a task opened from a section still reads as part of settings and
 * the rail stays lit on the section it came from. The four sections themselves
 * no longer live here — they stack on `SettingsDesktopPage`, and their root
 * routes redirect into it. Non-settings consumers (Profile tab, notifications
 * inbox) keep the mobile frame on every width.
 */
import { Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type Href, usePathname } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RAIL_GAP, SettingsRail } from "@/components/settings-rail";
import {
  SettingsSectionHeading,
  settingsSectionForPath,
  settingsSectionHref,
} from "@/features/settings";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
import { useI18n } from "@/providers/i18n-provider";

export function SettingsScreenShell({
  title,
  description,
  children,
  scroll = true,
}: {
  title: string;
  /** One-line pane summary under the title — desktop web only (per the demo). */
  description?: string | undefined;
  children: ReactNode;
  /** Set false when the screen renders its own list/scroll (e.g. FlatList). */
  scroll?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const navInset = useNavBarInset();
  const router = useAppRouter();
  const pathname = usePathname();
  const isDesktopWeb = useIsDesktopWeb();
  const { t } = useI18n();

  const goBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  };

  if (isDesktopWeb && withoutLocale(pathname).startsWith("/settings")) {
    return (
      <DesktopSettingsFrame
        title={title}
        description={description}
        pathname={pathname}
        scroll={scroll}
        goBack={goBack}
      >
        {children}
      </DesktopSettingsFrame>
    );
  }

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
    <YStack flex={1} backgroundColor={palette.bg} paddingTop={insets.top + navInset}>
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

function DesktopSettingsFrame({
  title,
  description,
  pathname,
  scroll,
  goBack,
  children,
}: {
  title: string;
  description?: string | undefined;
  pathname: string;
  scroll: boolean;
  goBack: () => void;
  children: ReactNode;
}): ReactElement {
  const palette = useEditorialPalette();
  const navInset = useNavBarInset();
  const router = useAppRouter();
  const { t } = useI18n();

  const paneHeader = (
    <SettingsSectionHeading
      title={title}
      description={description}
      leading={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={goBack}
          hitSlop={8}
        >
          <Icon as={ChevronLeft} size={20} color={palette.ink} />
        </Pressable>
      }
    />
  );

  // The app navbar floats OVER the scene on desktop, so both columns start
  // below it — otherwise the first heading sits behind the frosted bar.
  const topPad = navInset + 24;

  return (
    <XStack flex={1} backgroundColor={palette.bg} paddingHorizontal={16}>
      {/* Rail stays put while only the pane scrolls — the sticky behavior. */}
      <YStack paddingTop={topPad}>
        <SettingsRail
          activeId={settingsSectionForPath(pathname)}
          // A drill-down's rail is a way back out to the page, not a pane
          // switcher: it leaves the task and lands on the section it belongs to.
          onSelect={(id) => router.replace(settingsSectionHref(id) as Href)}
        />
      </YStack>

      <YStack flex={1} minWidth={0} marginLeft={RAIL_GAP}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ paddingTop: topPad, paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {paneHeader}
            {children}
          </ScrollView>
        ) : (
          <YStack flex={1} paddingTop={topPad}>
            {paneHeader}
            {children}
          </YStack>
        )}
      </YStack>
    </XStack>
  );
}
