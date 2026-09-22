import { authDialogPalette } from "@patch-careers/tokens";
import { useThemeName } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AUTH_MENU_ICON_COLOR,
  AUTH_MENU_ICON_SIZE,
  AUTH_MENU_RADIUS,
  AUTH_MENU_SIZE,
  AUTH_MENU_STROKE_WIDTH,
  AUTH_NAV_SIDE_INSET,
} from "@/components/nav-bar/auth-nav-style";
import { NavBrand } from "@/components/nav-bar/nav-brand";
import { StaggeredMenu } from "@/components/nav-bar/staggered-menu";
import { useLocaleSwitch } from "@/navigation/use-locale-switch";
import { useColorSchemeStore } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";

/** Native public chrome for the shared /auth page. */
export function AuthPageHeader(): ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale, t } = useI18n();
  const switchLocale = useLocaleSwitch();
  const scheme = useColorSchemeStore((state) => state.scheme);
  const setScheme = useColorSchemeStore((state) => state.setScheme);
  const [open, setOpen] = useState(false);
  const theme = useThemeName();
  const palette = authDialogPalette[theme];

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + 4,
        left: AUTH_NAV_SIDE_INSET,
        right: AUTH_NAV_SIDE_INSET,
        zIndex: 10,
      }}
    >
      <View
        style={{
          height: 50,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Patch"
          onPress={() => router.push("/")}
        >
          <NavBrand height={40} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("landing.nav.openMenu")}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((current) => !current)}
          style={{
            width: AUTH_MENU_SIZE,
            height: AUTH_MENU_SIZE,
            borderRadius: AUTH_MENU_RADIUS,
            borderWidth: 0,
            backgroundColor: "transparent",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StaggeredMenu
            size={AUTH_MENU_ICON_SIZE}
            color={AUTH_MENU_ICON_COLOR[theme]}
            strokeWidth={AUTH_MENU_STROKE_WIDTH}
          />
        </Pressable>
      </View>
      {open ? (
        <View
          style={{
            position: "absolute",
            top: 55,
            right: 8,
            width: 230,
            padding: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.inputBorder,
            backgroundColor: palette.input,
            elevation: 8,
          }}
        >
          <Text
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              color: palette.muted,
              fontSize: 12,
            }}
          >
            {t("landing.nav.langRegion")}
          </Text>
          <Pressable
            onPress={() => {
              void switchLocale(locale === "en" ? "pt-BR" : "en");
              setOpen(false);
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Text style={{ color: palette.brand, fontSize: 15 }}>
              {locale === "en" ? "Português" : "English"}
            </Text>
          </Pressable>
          <Text
            style={{
              paddingHorizontal: 12,
              paddingTop: 12,
              paddingBottom: 8,
              color: palette.muted,
              fontSize: 12,
            }}
          >
            {t("landing.nav.theme")}
          </Text>
          <Pressable
            onPress={() => {
              setScheme(scheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Text style={{ color: palette.brand, fontSize: 15 }}>
              {t(scheme === "dark" ? "profile.menu.theme.light" : "profile.menu.theme.dark")}
            </Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: palette.inputBorder, marginVertical: 8 }} />
          <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: palette.brand, fontSize: 15 }}>{t("landing.nav.help")}</Text>
          </View>
          {(["privacy", "terms"] as const).map((kind) => (
            <Pressable
              key={kind}
              accessibilityRole="link"
              onPress={() => {
                setOpen(false);
                void Linking.openURL(`https://patchcareers.org/${kind}`);
              }}
              style={{ paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Text style={{ color: palette.brand, fontSize: 15 }}>
                {t(kind === "privacy" ? "landing.nav.privacy" : "landing.nav.termsOfUse")}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
