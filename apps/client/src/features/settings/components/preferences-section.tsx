/**
 * `PreferencesSection` — theme and language.
 *
 * Body only, no frame: the mobile route wraps it in `SettingsScreenShell`, the
 * desktop single page stacks it with the other three.
 */

import type { Locale } from "@patch-careers/i18n";
import type { ColorScheme } from "@patch-careers/state";
import { SettingsCard } from "@patch-careers/ui/editorial";
import { MonitorSmartphone, Moon, Sun } from "lucide-react-native";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useLocaleSwitch } from "@/navigation/use-locale-switch";
import { useColorSchemeStore } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";
import { useSet } from "../lib/styles";
import { PillSelect, SectionHeader, SettingSelectRow } from "./settings-ui";

export function PreferencesSection(): ReactElement {
  const { t, locale } = useI18n();
  const switchLocale = useLocaleSwitch();
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
          onChange={(next) => void switchLocale(next)}
        />
      </SettingsCard>
    );
  }

  return (
    <>
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
            onChange={(next) => void switchLocale(next)}
          />
        </View>
      </SettingsCard>
    </>
  );
}
