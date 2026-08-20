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
 * On desktop web (≥1024), settings routes swap the stacked mobile frame for a
 * LinkedIn-style master-detail: a sticky left rail (serif "Configurações"
 * masthead + section nav + sign-out) beside the active section's pane. The
 * rail reads the active section from the URL, so section switches are real
 * route replaces and deep links land highlighted. Non-settings consumers
 * (Profile tab, notifications inbox) keep the mobile frame on every width.
 */
import { logout } from "@patch-careers/auth";
import { editorialOverlays } from "@patch-careers/tokens";
import { Divider, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { type Href, usePathname, useRouter } from "expo-router";
import { Bell, ChevronLeft, LockKeyhole, LogOut, Palette, UserRound } from "lucide-react-native";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useI18n } from "@/providers/i18n-provider";

// Rail geometry from the approved settings-web-demo: 232px column, 40px-tall
// items, the pane separated by one wide gutter inside the shared 960 column.
const RAIL_WIDTH = 232;
const RAIL_GAP = 40;

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };

type Section = {
  route: Href & string;
  labelKey: string;
  icon: ComponentType<GlyphProps>;
  /** Sub-screens that keep this section lit in the rail (URL prefix match). */
  children: readonly string[];
};

const SECTIONS: readonly Section[] = [
  {
    route: "/settings/account",
    labelKey: "settings.account.title",
    icon: UserRound,
    children: [
      "/settings/change-email",
      "/settings/change-password",
      "/settings/username",
      "/settings/connected-accounts",
      "/settings/verify-code",
    ],
  },
  {
    route: "/settings/privacy",
    labelKey: "settings.privacy.title",
    icon: LockKeyhole,
    children: ["/settings/blocked"],
  },
  {
    route: "/settings/notifications",
    labelKey: "settings.notifications.title",
    icon: Bell,
    children: [],
  },
  {
    route: "/settings/preferences",
    labelKey: "settings.preferences.title",
    icon: Palette,
    children: [],
  },
];

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
  const router = useRouter();
  const pathname = usePathname();
  const isDesktopWeb = useIsDesktopWeb();
  const { t } = useI18n();

  const goBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  };

  if (isDesktopWeb && pathname.startsWith("/settings")) {
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
  const router = useRouter();
  const { t } = useI18n();

  const isSectionRoot = SECTIONS.some((s) => s.route === pathname);
  const activeRoute =
    SECTIONS.find((s) => pathname === s.route || s.children.some((c) => pathname.startsWith(c)))
      ?.route ?? null;

  async function signOut(): Promise<void> {
    await logout();
    router.replace(AUTH_SIGN_IN_ROUTE);
  }

  const paneHeader = (
    <YStack marginBottom={description ? 24 : 6}>
      <XStack alignItems="center" gap={10}>
        {isSectionRoot ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            onPress={goBack}
            hitSlop={8}
          >
            <Icon as={ChevronLeft} size={20} color={palette.ink} />
          </Pressable>
        )}
        <Text fontFamily={editorialFonts.serif} fontSize={19} lineHeight={26} color={palette.ink}>
          {title}
        </Text>
      </XStack>
      {description ? (
        <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted} marginTop={6}>
          {description}
        </Text>
      ) : null}
    </YStack>
  );

  return (
    <XStack flex={1} backgroundColor={palette.bg} gap={RAIL_GAP} paddingHorizontal={16}>
      {/* Rail stays put while only the pane scrolls — the sticky behavior. */}
      <YStack width={RAIL_WIDTH} paddingTop={40}>
        <Text
          fontFamily={editorialFonts.serif}
          fontSize={26}
          lineHeight={34}
          color={palette.ink}
          paddingHorizontal={12}
        >
          {t("settings.title")}
        </Text>

        <YStack marginTop={24} gap={2}>
          {SECTIONS.map((section) => (
            <RailItem
              key={section.route}
              icon={section.icon}
              label={t(section.labelKey)}
              active={section.route === activeRoute}
              onPress={() => {
                // Replace, not push — the rail switches panes, it doesn't
                // stack a history entry per section visit.
                if (section.route !== pathname) router.replace(section.route);
              }}
            />
          ))}
        </YStack>

        <YStack marginVertical={16} marginHorizontal={12}>
          <Divider color={palette.hairline} />
        </YStack>

        <RailItem
          icon={LogOut}
          label={t("settings.signOut")}
          danger
          onPress={() => void signOut()}
        />
      </YStack>

      <YStack flex={1} minWidth={0}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ paddingTop: 40, paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {paneHeader}
            {children}
          </ScrollView>
        ) : (
          <YStack flex={1} paddingTop={40}>
            {paneHeader}
            {children}
          </YStack>
        )}
      </YStack>
    </XStack>
  );
}

function RailItem({
  icon,
  label,
  active = false,
  danger = false,
  onPress,
}: {
  icon: ComponentType<GlyphProps>;
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const [hovered, setHovered] = useState(false);

  const color = danger ? palette.danger : active || hovered ? palette.ink : palette.body;
  const background = active
    ? palette.surface
    : hovered
      ? editorialOverlays[theme].rowHover
      : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        height: 40,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: background,
        overflow: "hidden",
      }}
    >
      {active ? (
        // The demo's `inset 2px 0 0 ink` — a hairline of ink hugging the
        // row's left edge, clipped by the rounded corners above.
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: palette.ink,
          }}
        />
      ) : null}
      <Icon as={icon} size={17} color={color} strokeWidth={1.75} />
      <Text fontFamily={editorialFonts.sans} fontSize={13.5} color={color}>
        {label}
      </Text>
    </Pressable>
  );
}
