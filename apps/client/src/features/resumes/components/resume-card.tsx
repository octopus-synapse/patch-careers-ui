/**
 * One resume in the Currículos sub-tab: serif title (+ "Principal" badge on
 * the master), meta line (edited-ago · language · style), an eye icon that
 * opens the HTML preview modal directly, and the resume's tailored LLM
 * variants grouped as indented sub-rows. Tapping the card opens the detail
 * screen.
 */
import type { Locale, Translator } from "@patch-careers/i18n";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { CornerDownRight, Eye } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { webNoOutline } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import type { ResumeListItem } from "../hooks/queries";
import { useTailoredVersions } from "../hooks/queries";
import { editedAgo } from "../lib/helpers";
import { useRz } from "../lib/styles";

export function resumeMetaLine(item: ResumeListItem, t: Translator, locale: Locale): string {
  const parts = [
    t("resumes.card.editedMeta", { ago: editedAgo(item.updatedAt, t, locale) }),
    item.language?.toUpperCase(),
    item.style?.name,
  ];
  return parts.filter(Boolean).join(" · ");
}

export function ResumeCard({
  item,
  onOpen,
  onPreview,
}: {
  item: ResumeListItem;
  onOpen: () => void;
  onPreview: () => void;
}): ReactElement {
  const { t, locale } = useI18n();
  const rz = useRz();
  const palette = useEditorialPalette();
  const [active, setActive] = useState(false);
  const { versions } = useTailoredVersions(item.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onOpen}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={({ pressed }) => [rz.card, (active || pressed) && rz.cardActive, webNoOutline]}
    >
      <View style={rz.cardHead}>
        <View style={rz.cardTitleWrap}>
          <View style={rz.cardTitleRow}>
            <Text style={rz.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.isPrimary ? (
              <View style={rz.masterBadge}>
                <Text style={rz.masterBadgeText}>{t("resumes.card.masterBadge")}</Text>
              </View>
            ) : null}
          </View>
          <Text style={rz.cardMeta} numberOfLines={1}>
            {resumeMetaLine(item, t, locale)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("resumes.card.previewLabel", { title: item.title })}
          hitSlop={8}
          onPress={onPreview}
          style={rz.eyeButton}
        >
          <Eye size={18} color={palette.ink} strokeWidth={1.75} />
        </Pressable>
      </View>

      {versions.length > 0 ? (
        <View style={rz.tailoredList}>
          {versions.map((version) => (
            <View key={version.id} style={rz.tailoredRow}>
              <CornerDownRight size={13} color={palette.subtle} strokeWidth={1.75} />
              <Text style={rz.tailoredText} numberOfLines={1}>
                {version.label ?? t("resumes.card.version", { number: version.versionNumber })}
                {version.tailoredJobTitle ? (
                  <Text style={rz.tailoredJob}>
                    {" — "}
                    {version.tailoredJobTitle}
                    {version.tailoredJobCompany ? ` · ${version.tailoredJobCompany}` : ""}
                  </Text>
                ) : null}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}
