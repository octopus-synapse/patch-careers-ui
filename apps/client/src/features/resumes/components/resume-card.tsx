/**
 * One resume in the Currículos sub-tab: serif title (+ "Principal" badge on
 * the master), meta line (edited-ago · language · style), an eye icon that
 * opens the HTML preview modal directly, and the resume's tailored LLM
 * variants grouped as indented sub-rows. Tapping the card opens the detail
 * screen.
 */
import type { Locale, Translator } from "@patch-careers/i18n";
import { StyleScoreChip } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Copy, CornerDownRight, Eye, Trash2 } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ResumeThumbnail } from "@/components/resume-thumbnail";
import { StyleScoreBadge } from "@/components/style-score-badge";
import { webNoOutline } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import type { ResumeListItem } from "../hooks/queries";
import { useTailoredVersions } from "../hooks/queries";
import { editedAgo } from "../lib/helpers";
import { useRz } from "../lib/styles";
import { QualityScoreBadge } from "./quality-score-badge";

type Glyph = typeof Eye;

/** Small round icon button used in the card head (web inline duplicate/delete). */
function CardActionButton({
  label,
  icon: Icon,
  danger = false,
  onPress,
}: {
  label: string;
  icon: Glyph;
  danger?: boolean;
  onPress: () => void;
}): ReactElement {
  const rz = useRz();
  const palette = useEditorialPalette();
  const [active, setActive] = useState(false);
  const tint = danger ? palette.danger : palette.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={[
        rz.eyeButton,
        active && (danger ? rz.headActionBtnDanger : rz.headActionBtnActive),
        webNoOutline,
      ]}
    >
      <Icon size={17} color={active ? tint : palette.muted} strokeWidth={1.75} />
    </Pressable>
  );
}

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
  onDuplicate,
  onDelete,
  canDuplicate = true,
  inlineActions = false,
}: {
  item: ResumeListItem;
  onOpen: () => void;
  onPreview: () => void;
  /** Duplicate this resume (web inline button). Native uses the swipe drawer. */
  onDuplicate?: (() => void) | undefined;
  /** Delete this resume. Absent on the master, which can never be deleted. */
  onDelete?: (() => void) | undefined;
  /** Slots remaining — duplicate is disabled when the list is full. */
  canDuplicate?: boolean;
  /** Render the inline duplicate/delete icon buttons (web; native swipes). */
  inlineActions?: boolean;
}): ReactElement {
  const { t, locale } = useI18n();
  const rz = useRz();
  const palette = useEditorialPalette();
  const [active, setActive] = useState(false);
  const { versions } = useTailoredVersions(item.id);
  const showDuplicate = inlineActions && onDuplicate && canDuplicate;
  const showDelete = inlineActions && onDelete;

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
        <ResumeThumbnail resumeId={item.id} width={48} height={64} radius={8} />
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
            {item.style ? (
              <StyleScoreBadge styleId={item.style.id} styleScore={item.style.styleScore} />
            ) : null}
            <QualityScoreBadge resumeId={item.id} updatedAt={item.updatedAt} />
          </View>
          <Text style={rz.cardMeta} numberOfLines={1}>
            {resumeMetaLine(item, t, locale)}
          </Text>
        </View>
        <View style={rz.headActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("resumes.card.previewLabel", { title: item.title })}
            hitSlop={8}
            onPress={onPreview}
            style={rz.eyeButton}
          >
            <Eye size={18} color={palette.ink} strokeWidth={1.75} />
          </Pressable>
          {showDuplicate ? (
            <CardActionButton
              label={t("resumes.card.duplicateLabel", { title: item.title })}
              icon={Copy}
              onPress={onDuplicate}
            />
          ) : null}
          {showDelete ? (
            <CardActionButton
              label={t("resumes.card.deleteLabel", { title: item.title })}
              icon={Trash2}
              danger
              onPress={onDelete}
            />
          ) : null}
        </View>
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
              {/* Tailored versions are snapshots of the parent resume, so they
                  inherit its active template — show the same Style Score. */}
              {item.style ? (
                <StyleScoreChip
                  score={item.style.styleScore}
                  size="sm"
                  accessibilityLabel={t("resumes.styleScore.a11y", {
                    score: Math.round(item.style.styleScore),
                  })}
                />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}
