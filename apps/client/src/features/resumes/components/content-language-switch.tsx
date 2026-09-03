/**
 * <ContentLanguageSwitch> — which VERSION of a résumé is being shown and
 * edited: the two languages as pills, and one line under them that says what
 * the shown version IS (ADR-0011, decisions 9–10).
 *
 * This moves the content locale only. On the profile, section titles, field
 * labels, dates and enum values keep following the app's language; on the
 * résumé detail the whole document follows the pick. The pills follow the
 * landing's chip pattern — active is filled ink, inactive is surface with a
 * hairline. No pencil: the two options ARE the control.
 */

import type { Locale } from "@patch-careers/i18n";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import type { LocaleTranslationStatus, TranslationProgress } from "../hooks/use-resume-translation";
import { useRz } from "../lib/styles";

export function ContentLanguageSwitch({
  value,
  onChange,
  status,
  progress,
  align = "start",
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
  /** Translation rollup for the version being shown (null while loading or for the canonical one). */
  status?: LocaleTranslationStatus | null;
  /** The latest live event of a run for this résumé, while one is going. */
  progress?: TranslationProgress | null;
  /** "start" in a card or a row; "center" under the mobile masthead. */
  align?: "start" | "center" | "end";
}): ReactElement {
  const { t } = useI18n();
  const rz = useRz();
  const [hovered, setHovered] = useState<Locale | null>(null);
  const caption = captionFor(t, status ?? null, progress ?? null);

  const options: Array<{ locale: Locale; label: string }> = [
    { locale: "en", label: t("profile.language.en") },
    { locale: "pt-BR", label: t("profile.language.pt") },
  ];
  const alignItems = align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start";

  return (
    <View style={{ alignItems }}>
      <View style={rz.langPills}>
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
                rz.langPill,
                on && rz.langPillActive,
                !on && hovered === option.locale && rz.langPillHover,
              ]}
            >
              <Text style={[rz.langPillLabel, on && rz.langPillLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[rz.langCaption, align === "center" && rz.langCaptionCenter]}>{caption}</Text>
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
