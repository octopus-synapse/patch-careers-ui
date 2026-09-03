/**
 * One saved section entry, rendered open.
 *
 * `SwipeableItemRow` shows an item as two truncated lines because it sits in
 * an index the user taps through. This one is the page: role, organisation,
 * date range, prose and achievements each get their own line, so nothing is
 * behind a tap.
 *
 * Delete is not here. In the index a trash icon per row makes sense because
 * the row is all you have; here the row is the content, and a delete affordance
 * beside every item on a full page is an easy misclick. Deletion lives in the
 * edit modal, one deliberate step in.
 *
 * Web-only by construction — the desktop profile is the only surface that
 * renders items open — so it uses hover, not swipe.
 */

import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Pencil } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { itemDetail } from "../lib/item-detail";
import { useEd, webNoOutline } from "../lib/styles";
import type { SectionField, SectionItem } from "../types";

export function SectionDetailRow({
  item,
  fields,
  onEdit,
  isFirst = false,
  isLast = false,
}: {
  item: SectionItem;
  fields?: SectionField[] | undefined;
  onEdit: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}): ReactElement {
  const ed = useEd();
  const palette = useEditorialPalette();
  const { locale, t } = useI18n();
  const [active, setActive] = useState(false);

  const detail = itemDetail(item, fields, locale, t("sections.present"));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("sections.item.editA11y", { title: detail.title })}
      onPress={onEdit}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={[ed.detailRow, isFirst && ed.detailRowFirst, isLast && ed.detailRowLast, webNoOutline]}
    >
      <View style={ed.detailHead}>
        <Text style={ed.detailTitle}>{detail.title}</Text>
        {detail.dateRange ? <Text style={ed.detailDate}>{detail.dateRange}</Text> : null}
        {/* The pencil only appears under the pointer: on a page of open items a
            permanent icon per row is visual noise for an action the whole row
            already performs. */}
        <Pencil
          size={14}
          color={active ? palette.muted : palette.panel}
          strokeWidth={2}
          accessibilityElementsHidden
        />
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
  );
}
