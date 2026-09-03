/**
 * <ProfileLanguageCard> — which language the page reads the resume in.
 *
 * It does NOT write anything. The plan called for it to PATCH the master
 * resume's `language`, but `UpdateResumeRequest` has no `language` field —
 * checked against the generated contract, not assumed — so there is nothing to
 * send. What it does instead is real and useful: it drives the `localeOverride`
 * handed to `useResumeSections`, and the section titles and add labels come
 * back from the backend in that language. So the card switches the view of the
 * document, which is most of what the switch was for.
 *
 * No pencil: the two options ARE the control. The pills follow the landing's
 * chip pattern — active is filled ink, inactive is surface with a hairline.
 */

import type { Locale } from "@patch-careers/i18n";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";

export function ProfileLanguageCard({
  value,
  onChange,
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
}): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  const [hovered, setHovered] = useState<Locale | null>(null);

  const options: Array<{ locale: Locale; label: string }> = [
    { locale: "en", label: t("profile.language.en") },
    { locale: "pt-BR", label: t("profile.language.pt") },
  ];

  return (
    <View style={pf.railCard}>
      <Text style={pf.railCardTitle} accessibilityRole="header">
        {t("profile.language.title")}
      </Text>
      <View style={pf.langPills}>
        {options.map((option) => {
          const on = option.locale === value;
          return (
            <Pressable
              key={option.locale}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t("profile.language.optionA11y", { label: option.label })}
              onPress={() => onChange(option.locale)}
              onHoverIn={() => setHovered(option.locale)}
              onHoverOut={() => setHovered(null)}
              style={[
                pf.langPill,
                on && pf.langPillActive,
                !on && hovered === option.locale && pf.langPillHover,
              ]}
            >
              <Text style={[pf.langPillLabel, on && pf.langPillLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={pf.railCaption}>{t("profile.language.caption")}</Text>
    </View>
  );
}
