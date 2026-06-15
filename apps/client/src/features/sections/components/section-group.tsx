/**
 * One section group in the resume section manager: small-caps label + the
 * section's item rows. A mandatory section with zero items renders its
 * explicit empty state (the catalog's `noDataLabel` — "filled empty", not
 * "missing"). There is deliberately NO per-group add affordance: adding goes
 * through the manager's single bottom add box.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { itemSummary } from "../lib/helpers";
import type { MergedSection } from "../lib/section-visibility";
import { useEd } from "../lib/styles";
import type { SectionItem } from "../types";
import { SwipeableItemRow } from "./swipeable-item-row";

export function SectionGroup({
  section,
  onEditItem,
  onDeleteItem,
  deleteLabel,
}: {
  section: MergedSection;
  onEditItem: (item: SectionItem, index: number) => void;
  onDeleteItem: (item: SectionItem, index: number) => void;
  deleteLabel: string;
}): ReactElement {
  const ed = useEd();
  const styles = stylesByTheme[useThemeName()];
  const { locale } = useI18n();
  const fields = section.descriptor.fields ?? undefined;
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{section.title}</Text>
      {section.items.length === 0 ? (
        <Text style={styles.empty}>{section.noDataLabel}</Text>
      ) : (
        <View style={ed.list}>
          {section.items.map((item, index) => (
            <SwipeableItemRow
              key={item.id ?? `${index}-${itemSummary(item, locale, fields)}`}
              index={index}
              item={item}
              fields={fields}
              onEdit={() => onEditItem(item, index)}
              onDelete={() => onDeleteItem(item, index)}
              deleteLabel={deleteLabel}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    group: { gap: 12 },
    label: {
      fontFamily: fonts.sans,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: p.muted,
    },
    empty: {
      fontFamily: fonts.sans,
      fontSize: 14,
      lineHeight: 20,
      color: p.subtle,
      fontStyle: "italic",
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
