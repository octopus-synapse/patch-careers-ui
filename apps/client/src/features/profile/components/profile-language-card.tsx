/**
 * <ProfileLanguageCard> — which VERSION of the resume the page shows and edits.
 *
 * ADR-0011: this moves the content locale only. Section titles, field labels,
 * dates and enum values keep following the app's language; what changes is
 * the text the person wrote, in the version they pick. Persisting the choice
 * to the resume arrives with `UpdateResumeRequest.language`; until then the
 * card is the view choice, seeded from the master resume's language.
 *
 * No pencil: the two options ARE the control. The pills follow the landing's
 * chip pattern — active is filled ink, inactive is surface with a hairline.
 */

import type { Locale } from "@patch-careers/i18n";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { LocaleTranslationStatus, TranslationProgress } from "@/features/resumes";
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
  /** Translation rollup for the version being shown (null while loading or for the canonical one). */
  status?: LocaleTranslationStatus | null;
  /** The latest live event of a run for this résumé, while one is going. */
  progress?: TranslationProgress | null;
}): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  const [hovered, setHovered] = useState<Locale | null>(null);
  const caption = captionFor(t, status ?? null, progress ?? null);

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
              // `aria-selected` reaches the DOM on web and maps to
              // accessibilityState on native; `accessibilityState` alone
              // never made it into the web tree.
              aria-selected={on}
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
      <Text style={pf.railCaption}>{caption}</Text>
    </View>
  );
}

/**
 * One line under the pills that says what the shown version IS: translating
 * (with the section count), stale in N items, refused for a reason, or the
 * plain explanation. The switch itself never blocks (ADR-003 §14–15).
 */
function captionFor(
  t: ReturnType<typeof useI18n>["t"],
  status: LocaleTranslationStatus | null,
  progress: TranslationProgress | null,
): string {
  if (progress?.status === "running") {
    return t("profile.language.translating", { done: progress.done, total: progress.total });
  }
  if (progress?.status === "failed") return t("profile.language.failed");
  if (progress?.status === "skipped" && progress.reason === "monthly-cap") {
    return t("profile.language.capReached");
  }
  if (progress?.status === "skipped" && progress.reason !== undefined) {
    return t("profile.language.unavailable");
  }
  if (status && status.role === "derived") {
    if (status.items.missing > 0)
      return t("profile.language.missing", { count: status.items.missing });
    if (status.items.stale > 0) return t("profile.language.stale", { count: status.items.stale });
  }
  return t("profile.language.caption");
}
