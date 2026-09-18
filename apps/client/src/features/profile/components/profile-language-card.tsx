/**
 * <ProfileLanguageCard> — the desktop rail's frame around the language switch:
 * a titled card, the control itself living in the resumes feature so the
 * résumé detail and the mobile masthead render the very same pills.
 */

import type { Locale } from "@patch-careers/i18n";
import type { ReactElement } from "react";
import { Text, View } from "react-native";
import {
  ContentLanguageSwitch,
  type LocaleTranslationStatus,
  type TranslationProgress,
} from "@/features/resumes";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";

export function ProfileLanguageCard({
  value,
  onChange,
  status,
  progress,
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
  status?: LocaleTranslationStatus | null;
  progress?: TranslationProgress | null;
}): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  return (
    <View style={[pf.railCard, pf.languageCard]}>
      <Text style={pf.railCardTitle} accessibilityRole="header">
        {t("profile.language.title")}
      </Text>
      <ContentLanguageSwitch
        value={value}
        onChange={onChange}
        status={status ?? null}
        progress={progress ?? null}
        showCaption={false}
      />
    </View>
  );
}
