/**
 * One saved section entry, rendered open.
 *
 * `SwipeableItemRow` shows an item as two truncated lines because it sits in
 * an index the user taps through. This one is the page: role, organisation,
 * date range, prose and achievements each get their own line, so nothing is
 * behind a tap.
 *
 * Edit and delete actions appear together on hover/focus. Delete remains a
 * separate target and goes through the manager's confirmation dialog.
 *
 * Web-only by construction — the desktop profile is the only surface that
 * renders items open — so it uses hover, not swipe.
 */

import type { Locale } from "@patch-careers/i18n";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Pencil, Trash2 } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { translatorFor } from "@/providers/i18n-provider";
import { itemDetail } from "../lib/item-detail";
import { useEd, webNoOutline } from "../lib/styles";
import type { SectionField, SectionItem } from "../types";

export function SectionDetailRow({
  item,
  fields,
  chromeLocale,
  onEdit,
  onDelete,
  isFirst = false,
  isLast = false,
}: {
  item: SectionItem;
  fields?: SectionField[] | undefined;
  /** Dates, enum values and "Presente" follow the surface's chrome (ADR-0011). */
  chromeLocale: Locale;
  onEdit: () => void;
  onDelete: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}): ReactElement {
  const ed = useEd();
  const palette = useEditorialPalette();
  const t = translatorFor(chromeLocale);
  const [active, setActive] = useState(false);
  const [deleteActive, setDeleteActive] = useState(false);

  const detail = itemDetail(item, fields, chromeLocale, t("sections.present"));

  return (
    <View
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      style={[ed.detailRow, isFirst && ed.detailRowFirst, isLast && ed.detailRowLast]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("sections.item.editA11y", { title: detail.title })}
        onPress={onEdit}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        style={webNoOutline}
      >
        <View style={ed.detailHead}>
          <Text style={ed.detailTitle}>{detail.title}</Text>
          {detail.dateRange ? <Text style={ed.detailDate}>{detail.dateRange}</Text> : null}
          {/* A derived copy says how fresh it is; a hand-written one says so too.
            Silent for the canonical text and for a current copy. */}
          {translationMark(t, item) ? (
            <Text style={ed.detailDate}>{translationMark(t, item)}</Text>
          ) : null}
        </View>

        {detail.subtitle ? <Text style={ed.detailOrg}>{detail.subtitle}</Text> : null}
        {detail.description ? <Text style={ed.detailDescription}>{detail.description}</Text> : null}

        {detail.achievements.length > 0 ? (
          <View style={ed.detailAchievements}>
            {detail.achievements.map((achievement) => (
              <View key={achievement} style={ed.detailAchievementRow}>
                <Text style={ed.detailDash}>—</Text>
                <Text style={ed.detailAchievement}>{achievement}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>

      <View style={[ed.detailActions, isFirst && ed.detailActionsFirst]}>
        <Pencil
          size={14}
          color={active ? palette.muted : palette.panel}
          strokeWidth={2}
          accessibilityElementsHidden
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("sections.item.deleteA11y", { title: detail.title })}
          onPress={onDelete}
          onHoverIn={() => setDeleteActive(true)}
          onHoverOut={() => setDeleteActive(false)}
          onFocus={() => {
            setActive(true);
            setDeleteActive(true);
          }}
          onBlur={() => {
            setActive(false);
            setDeleteActive(false);
          }}
          hitSlop={8}
          style={webNoOutline}
        >
          <Trash2
            size={15}
            color={deleteActive ? palette.danger : active ? palette.muted : palette.panel}
            strokeWidth={1.9}
          />
        </Pressable>
      </View>
    </View>
  );
}

function translationMark(t: ReturnType<typeof translatorFor>, item: SectionItem): string | null {
  if (item.origin === "manual" || item.origin === "diverged") return t("sections.item.handWritten");
  if (item.translationState === "stale") return t("sections.item.stale");
  if (item.translationState === "missing") return t("sections.item.untranslated");
  return null;
}
