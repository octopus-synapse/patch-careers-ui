/**
 * `PreferencesModal` — language and theme, one level below the nav menu.
 *
 * Lifted out of `PublicNavBar` (where only the public pages could reach it) and
 * redrawn in the navbar's own language: the panel's radius and hairline, the
 * bar's underline tabs, mono state readouts, and the menu's indigo marking the
 * chosen cell. The Airbnb furniture it used to carry — a 30px radius, a promo
 * box, a "Suggested" heading — belonged to the old chrome.
 *
 * Two rows deep on purpose. The menu row shows the current value; the choice
 * itself needs room (theme previews both palettes side by side), and `system`
 * is a real third state that an in-place toggle could not reach.
 */

import { editorialOverlays, editorialPalettes } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import {
  editorialFonts,
  useEditorialMenu,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import { type ReactElement, type ReactNode, useEffect } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useLocaleSwitch } from "@/navigation/use-locale-switch";
import { useColorSchemeStore } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";

const MODAL_MAX_WIDTH = 560;

export type PreferencesTab = "lang" | "theme";

export function PreferencesModal({
  tab,
  onTab,
  onClose,
}: {
  readonly tab: PreferencesTab;
  readonly onTab: (tab: PreferencesTab) => void;
  readonly onClose: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const overlays = editorialOverlays[theme];
  const { t, locale } = useI18n();
  const scheme = useColorSchemeStore((store) => store.scheme);
  const setScheme = useColorSchemeStore((store) => store.setScheme);
  const localeSwitch = useLocaleSwitch();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const langs = [
    { value: "pt-BR" as const, label: t("landing.nav.langPt"), sub: t("landing.nav.langPtRegion") },
    { value: "en" as const, label: t("landing.nav.langEn"), sub: t("landing.nav.langEnRegion") },
  ];
  const themes = [
    { value: "light" as const, label: t("profile.menu.theme.light") },
    { value: "dark" as const, label: t("profile.menu.theme.dark") },
    {
      value: "system" as const,
      label: t("profile.menu.theme.system"),
      sub: t("landing.nav.systemHint"),
    },
  ];

  return (
    <View
      style={{
        // Escapes the landing's stacking context on purpose — the modal covers
        // the page. RNW passes `fixed` through; RN's types do not know it.
        position: "fixed" as never,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 300,
        backgroundColor: overlays.scrimModal,
        alignItems: "center",
        justifyContent: "center",
      }}
      onStartShouldSetResponder={() => true}
      onResponderRelease={onClose}
    >
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => undefined}
        style={{ width: Math.min(MODAL_MAX_WIDTH, width * 0.92), maxHeight: height * 0.88 }}
      >
        <YStack
          backgroundColor={palette.panel}
          borderRadius={16}
          borderWidth={1}
          borderColor={palette.hairline}
          paddingHorizontal={24}
          paddingTop={8}
          paddingBottom={24}
          style={{
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 24 },
            shadowRadius: 48,
            shadowOpacity: theme === "dark" ? 0.6 : 0.22,
          }}
        >
          <XStack
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor={palette.hairline}
          >
            <XStack gap={22}>
              <ModalTab
                label={t("landing.nav.langRegion")}
                active={tab === "lang"}
                onPress={() => onTab("lang")}
              />
              <ModalTab
                label={t("landing.nav.theme")}
                active={tab === "theme"}
                onPress={() => onTab("theme")}
              />
            </XStack>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("landing.nav.close")}
              onPress={onClose}
            >
              <YStack
                width={32}
                height={32}
                borderRadius={999}
                alignItems="center"
                justifyContent="center"
                hoverStyle={{ backgroundColor: palette.bg }}
              >
                <X size={17} color={palette.ink} strokeWidth={1.8} />
              </YStack>
            </Pressable>
          </XStack>

          {tab === "lang" ? (
            <XStack gap={10} flexWrap="wrap" marginTop={20}>
              {langs.map((lang) => (
                <PreferenceCell
                  key={lang.value}
                  active={locale === lang.value}
                  onPress={() => {
                    onClose();
                    localeSwitch(lang.value);
                  }}
                >
                  <XStack alignItems="baseline" gap={8}>
                    <Text
                      flex={1}
                      fontFamily={editorialFonts.sans}
                      fontSize={14}
                      color={palette.ink}
                    >
                      {lang.label}
                    </Text>
                    <Text fontFamily={editorialFonts.mono} fontSize={11.5} color={palette.subtle}>
                      {lang.value}
                    </Text>
                  </XStack>
                  <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                    {lang.sub}
                  </Text>
                </PreferenceCell>
              ))}
            </XStack>
          ) : (
            <XStack gap={10} flexWrap="wrap" marginTop={20}>
              {themes.map((option) => (
                <PreferenceCell
                  key={option.value}
                  active={scheme === option.value}
                  onPress={() => setScheme(option.value)}
                >
                  <ThemeSwatch kind={option.value} />
                  <Text
                    fontFamily={editorialFonts.sans}
                    fontSize={14}
                    color={palette.ink}
                    marginTop={10}
                  >
                    {option.label}
                  </Text>
                  {option.sub ? (
                    <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                      {option.sub}
                    </Text>
                  ) : null}
                </PreferenceCell>
              ))}
            </XStack>
          )}
        </YStack>
      </View>
    </View>
  );
}

/** The bar's own tab shape: ink + a 2px underline riding the header's rule. */
function ModalTab({
  label,
  active,
  onPress,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress}>
      <YStack paddingTop={14} paddingBottom={14} position="relative">
        <Text
          fontFamily={editorialFonts.sans}
          fontSize={14}
          fontWeight={active ? "600" : "400"}
          color={active ? palette.ink : palette.muted}
        >
          {label}
        </Text>
        <YStack
          position="absolute"
          left={0}
          right={0}
          bottom={-1}
          height={2}
          borderRadius={1}
          backgroundColor={palette.ink}
          opacity={active ? 1 : 0}
        />
      </YStack>
    </Pressable>
  );
}

/** A choice, marked with the menu's indigo rather than a heavier ink border. */
function PreferenceCell({
  children,
  active,
  onPress,
}: {
  readonly children: ReactNode;
  readonly active: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const menu = useEditorialMenu();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
    >
      <YStack
        minWidth={150}
        flexGrow={1}
        borderRadius={11}
        borderWidth={1}
        borderColor={active ? menu.indigo : palette.hairline}
        backgroundColor={active ? menu.indigoSoft : "transparent"}
        hoverStyle={active ? undefined : { backgroundColor: palette.bg }}
        paddingHorizontal={14}
        paddingVertical={12}
        gap={2}
      >
        {children}
      </YStack>
    </Pressable>
  );
}

/**
 * Theme preview cards show BOTH palettes side by side, so the swatches
 * deliberately read the static `editorialPalettes` map instead of the
 * theme-resolved hook — a "dark" swatch must stay dark in light mode.
 */
function ThemeSwatch({ kind }: { readonly kind: "light" | "dark" | "system" }): ReactElement {
  const palette = useEditorialPalette();
  const light = editorialPalettes.light;
  const dark = editorialPalettes.dark;
  const serif = (color: string): ReactElement => (
    <Text
      position="absolute"
      top={6}
      left={10}
      fontSize={19}
      color={color}
      fontFamily={editorialFonts.serif}
    >
      Aa
    </Text>
  );
  return (
    <XStack
      height={56}
      borderRadius={8}
      borderWidth={1}
      borderColor={palette.hairlineStrong}
      overflow="hidden"
    >
      {kind !== "dark" && (
        <YStack flex={1} backgroundColor={light.bg} position="relative">
          {kind === "light" && serif(light.ink)}
        </YStack>
      )}
      {kind !== "light" && (
        <YStack flex={1} backgroundColor={dark.bg} position="relative">
          {kind === "dark" && serif(dark.ink)}
        </YStack>
      )}
    </XStack>
  );
}
