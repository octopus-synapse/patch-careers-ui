/**
 * Supersection block — a serif-titled group (optional leading icon + trailing
 * action) wrapping a (super)section's content on the Profile tab (identity,
 * links, and each standalone section get one). It is deliberately NOT a bordered
 * surface: the rows inside are already hairline cards, so a box here would nest
 * borders. Used only by the grouped layout; the flat manager (resume detail)
 * keeps the plain small-caps groups.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

export function SectionCard({
  title,
  leading,
  action,
  children,
}: {
  title: string;
  leading?: ReactNode;
  /** Optional trailing element in the header (e.g. an add button). */
  action?: ReactNode;
  children: ReactNode;
}): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {action}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    card: { gap: 12 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    leading: { width: 20, alignItems: "center" },
    title: { fontFamily: fonts.serif, fontSize: 18, color: p.ink },
    body: { gap: 10 },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
