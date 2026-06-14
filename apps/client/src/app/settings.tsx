/**
 * Settings — a standalone screen, NOT a bottom-tab item.
 *
 * Reached from the ProfileMenu's "Configurações" row via
 * `router.push("/settings")`; it sits at the root Stack level (sibling to
 * `(tabs)`) so it slides in over the tabs with its own slim back bar and no
 * global AppHeader.
 *
 * Layout takes after the IG "Settings and activity" screen — small-caps
 * section headers over grouped rows (leading icon · label · trailing value ·
 * chevron) — rebuilt in our Editorial Calm DS: warm paper, hairline-ruled
 * surface cards, serif title. The appearance group keeps our inline theme
 * pills rather than a sub-screen (only three options).
 */

import type { ColorScheme } from "@patch-careers/state";
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { type Href, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MonitorSmartphone,
  Moon,
  Send,
  Sun,
  User,
} from "lucide-react-native";
import type { ComponentType, ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorSchemeStore } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };
type Glyph = ComponentType<GlyphProps>;

/** Small-caps muted header that opens each grouped card. */
function SectionHeader({ label }: { label: string }): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

/** A navigable row: leading icon · label · optional trailing value · chevron. */
function SettingsRow({
  icon: RowIcon,
  label,
  value,
  onPress,
  first = false,
}: {
  icon: Glyph;
  label: string;
  value?: string | undefined;
  onPress: () => void;
  /** Skips the top hairline for the first row in a card. */
  first?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const styles = stylesByTheme[useThemeName()];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        first ? null : styles.rowDivider,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <RowIcon size={20} color={palette.body} strokeWidth={1.75} />
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <ChevronRight size={18} color={palette.subtle} strokeWidth={1.75} />
    </Pressable>
  );
}

const THEME_CHOICES: ReadonlyArray<{ value: ColorScheme; labelKey: string; icon: Glyph }> = [
  { value: "light", labelKey: "profile.menu.theme.light", icon: Sun },
  { value: "dark", labelKey: "profile.menu.theme.dark", icon: Moon },
  { value: "system", labelKey: "profile.menu.theme.system", icon: MonitorSmartphone },
];

/** Inline 3-option theme switcher — applies immediately (non-destructive). */
function ThemeSelector(): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const styles = stylesByTheme[useThemeName()];
  const scheme = useColorSchemeStore((s) => s.scheme);
  const setScheme = useColorSchemeStore((s) => s.setScheme);
  return (
    <View style={styles.themeRow}>
      {THEME_CHOICES.map(({ value, labelKey, icon: OptionIcon }) => {
        const selected = scheme === value;
        const label = t(labelKey);
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t("profile.menu.theme.optionA11y", { label })}
            onPress={() => setScheme(value)}
            style={[styles.themePill, selected ? styles.themePillSelected : null]}
          >
            <OptionIcon
              size={15}
              color={selected ? palette.ink : palette.muted}
              strokeWidth={1.75}
            />
            <Text style={[styles.themePillLabel, selected ? styles.themePillLabelSelected : null]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen(): ReactElement {
  const palette = useEditorialPalette();
  const styles = stylesByTheme[useThemeName()];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();

  // Standalone screen, so it owns its exit. Fall back to the home tab when
  // there's no back stack (e.g. opened via a cold deep link).
  function goBack(): void {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  }

  const go = (path: Href): void => router.push(path);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Slim back bar with a centered title — this screen has no AppHeader. */}
      <XStack alignItems="center" height={48} paddingHorizontal={8}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={goBack}
          hitSlop={8}
          style={styles.backButton}
        >
          <Icon as={ChevronLeft} size={26} color={palette.ink} />
        </Pressable>
        <Text style={styles.title}>{t("profile.menu.settings")}</Text>
        {/* Spacer balances the back button so the title stays centered. */}
        <View style={styles.backButton} />
      </XStack>

      <ScrollView
        contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader label={t("profile.settings.sections.account")} />
        <YStack style={styles.card}>
          <SettingsRow
            first
            icon={User}
            label={t("profile.settings.viewProfile")}
            onPress={() => go("/profile")}
          />
          <SettingsRow
            icon={Send}
            label={t("profile.settings.applications")}
            onPress={() => go("/applications")}
          />
          <SettingsRow
            icon={MessageCircle}
            label={t("profile.settings.messages")}
            onPress={() => go("/messages")}
          />
        </YStack>

        <SectionHeader label={t("profile.settings.sections.appearance")} />
        <YStack style={styles.card}>
          <View style={styles.themeCardInner}>
            <ThemeSelector />
          </View>
        </YStack>
      </ScrollView>
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    backButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    title: {
      flex: 1,
      textAlign: "center",
      fontFamily: editorialFonts.serif,
      fontSize: 22,
      color: p.ink,
    },
    scrollBody: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
    sectionHeader: {
      fontFamily: editorialFonts.sans,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.8,
      color: p.muted,
      marginTop: 18,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: p.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.hairline,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: p.hairline },
    rowPressed: { backgroundColor: p.bg },
    rowLabel: { flex: 1, fontFamily: editorialFonts.sans, fontSize: 15.5, color: p.ink },
    rowValue: { fontFamily: editorialFonts.sans, fontSize: 14, color: p.muted },
    themeCardInner: { paddingVertical: 14, paddingHorizontal: 14 },
    themeRow: { flexDirection: "row", gap: 8 },
    themePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 13,
      paddingVertical: 9,
    },
    themePillSelected: { borderColor: p.ink, backgroundColor: p.bg },
    themePillLabel: { fontFamily: editorialFonts.sans, fontSize: 12.5, color: p.muted },
    themePillLabelSelected: { color: p.ink, fontWeight: "600" },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
