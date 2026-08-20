/** Preferences — theme + language. */

import type { Locale } from "@patch-careers/i18n";
import type { ColorScheme } from "@patch-careers/state";
import { SettingsCard } from "@patch-careers/ui/editorial";
import { MonitorSmartphone, Moon, Sun } from "lucide-react-native";
import type { ReactElement } from "react";
import { View } from "react-native";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { PillSelect, SectionHeader, SettingSelectRow, useSet } from "@/features/settings";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useColorSchemeStore } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";

export default function PreferencesScreen(): ReactElement {
  const { t, locale, setLocale } = useI18n();
  const styles = useSet();
  const isDesktopWeb = useIsDesktopWeb();
  const scheme = useColorSchemeStore((s) => s.scheme);
  const setScheme = useColorSchemeStore((s) => s.setScheme);

  const themeOptions = [
    { value: "light" as const, label: t("profile.menu.theme.light"), icon: Sun },
    { value: "dark" as const, label: t("profile.menu.theme.dark"), icon: Moon },
    { value: "system" as const, label: t("profile.menu.theme.system"), icon: MonitorSmartphone },
  ];
  const languageOptions = [
    { value: "pt-BR" as const, label: t("settings.account.languageNames.ptBR") },
    { value: "en" as const, label: t("settings.account.languageNames.en") },
  ];

  // Desktop web mirrors the approved demo: one card, each preference a row
  // with its description and a contained segmented control on the right.
  if (isDesktopWeb) {
    return (
      <SettingsScreenShell
        title={t("settings.preferences.title")}
        description={t("settings.preferences.description")}
      >
        <SettingsCard>
          <SettingSelectRow<ColorScheme>
            first
            label={t("settings.preferences.themeLabel")}
            description={t("settings.preferences.themeDescription")}
            options={themeOptions}
            value={scheme}
            onChange={(next) => setScheme(next)}
          />
          <SettingSelectRow<Locale>
            label={t("settings.preferences.languageLabel")}
            description={t("settings.preferences.languageDescription")}
            options={languageOptions}
            value={locale}
            onChange={(next) => setLocale(next)}
          />
        </SettingsCard>
      </SettingsScreenShell>
    );
  }

  return (
    <SettingsScreenShell title={t("settings.preferences.title")}>
      <SectionHeader label={t("settings.preferences.themeLabel")} />
      <SettingsCard>
        <View style={styles.cardInner}>
          <PillSelect<ColorScheme>
            options={themeOptions}
            value={scheme}
            onChange={(next) => setScheme(next)}
          />
        </View>
      </SettingsCard>

      <SectionHeader label={t("settings.preferences.languageLabel")} />
      <SettingsCard>
        <View style={styles.cardInner}>
          <PillSelect<Locale>
            options={languageOptions}
            value={locale}
            onChange={(next) => setLocale(next)}
          />
        </View>
      </SettingsCard>
    </SettingsScreenShell>
  );
}
