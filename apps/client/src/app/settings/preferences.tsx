/** Preferences — theme + language. */

import type { Locale } from "@patch-careers/i18n";
import type { ColorScheme } from "@patch-careers/state";
import { MonitorSmartphone, Moon, Sun } from "lucide-react-native";
import type { ReactElement } from "react";
import { View } from "react-native";
import {
  PillSelect,
  SectionHeader,
  SettingsCard,
  SettingsScreenShell,
  useSet,
} from "@/features/settings";
import { useColorSchemeStore } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";

export default function PreferencesScreen(): ReactElement {
  const { t, locale, setLocale } = useI18n();
  const styles = useSet();
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
