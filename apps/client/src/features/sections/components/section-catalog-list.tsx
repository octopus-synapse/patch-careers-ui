import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import {
  editorialFonts as fonts,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { ChevronRight } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEd } from "../lib/styles";

export interface SectionCatalogOption {
  id: string;
  title: string;
  description: string;
  count?: number;
  disabled?: boolean;
}

export function SectionCatalogList({
  options,
  onPick,
}: {
  options: SectionCatalogOption[];
  onPick: (id: string) => void;
}): ReactElement {
  const ed = useEd();
  const styles = stylesByTheme[useThemeName()];
  const palette = useEditorialPalette();

  return (
    <ScrollView style={ed.flex} contentContainerStyle={styles.catalogScroll}>
      {options.map((option) => (
        <Pressable
          key={option.id}
          accessibilityRole="button"
          accessibilityLabel={option.title}
          accessibilityState={{ disabled: option.disabled }}
          disabled={option.disabled}
          onPress={() => onPick(option.id)}
          style={({ pressed }) => [
            styles.catalogRow,
            pressed && styles.catalogRowPressed,
            option.disabled && styles.catalogRowDisabled,
          ]}
        >
          <View style={styles.catalogBody}>
            <View style={styles.catalogTitleRow}>
              <Text style={styles.catalogTitle}>{option.title}</Text>
              {option.count ? <Text style={styles.catalogCount}>{option.count}</Text> : null}
            </View>
            <Text style={styles.catalogDesc} numberOfLines={2}>
              {option.description}
            </Text>
          </View>
          <ChevronRight size={18} color={palette.subtle} strokeWidth={1.75} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const stylesFor = (p: EditorialPalette) =>
  // @style-allow stylesheet: catalog layout and dynamic pressed/disabled row styles
  StyleSheet.create({
    catalogScroll: { paddingHorizontal: 24, paddingVertical: 12 },
    catalogRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    catalogRowPressed: { opacity: 0.7 },
    catalogRowDisabled: { opacity: 0.4 },
    catalogBody: { flex: 1, gap: 3 },
    catalogTitleRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    catalogTitle: { fontFamily: fonts.sans, fontSize: 15, color: p.ink },
    catalogCount: { fontFamily: fonts.mono, fontSize: 12, color: p.subtle },
    catalogDesc: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: p.muted },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
