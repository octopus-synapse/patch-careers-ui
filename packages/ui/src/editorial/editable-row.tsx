/**
 * `EditableRow` — the universal tappable row of the Editorial Calm system.
 *
 * One surface card (hairline border, radius 14) with an optional leading glyph,
 * a primary label + optional value/placeholder summary, and a trailing chevron.
 * It is the single visual unit the Profile tab is built from: resume section
 * items, profile fields (identity / about / links), and quality issues all
 * render as an `EditableRow` so "tap a row → focused edit sheet" reads the same
 * everywhere. Matches the `card` recipe in the sections stylesheet on purpose.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { ChevronRight } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { editorialPaletteFor } from "../internal/editorial-palette";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts as fonts } from "./fonts";

export type EditableRowProps = {
  /** Primary line — what the row is (e.g. "LinkedIn", "Experiência"). */
  label: string;
  /** Secondary summary shown muted under the label when present. */
  value?: string | undefined;
  /** Shown italic/subtle when there is no `value` (e.g. "Adicionar"). */
  placeholder?: string | undefined;
  /** Optional leading node (a lucide icon or a brand logo). */
  leading?: ReactNode | undefined;
  /** Overrides the default trailing chevron (e.g. a switch). */
  trailing?: ReactNode | undefined;
  onPress: () => void;
  accessibilityLabel?: string | undefined;
  disabled?: boolean | undefined;
};

export function EditableRow({
  label,
  value,
  placeholder,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
  disabled,
}: EditableRowProps): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  const palette = editorialPaletteFor(useThemeName());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled ?? false}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && !disabled ? styles.cardActive : null,
        disabled ? styles.dim : null,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>
        <Text style={styles.primary} numberOfLines={1}>
          {label}
        </Text>
        {value ? (
          <Text style={styles.meta} numberOfLines={1}>
            {value}
          </Text>
        ) : placeholder ? (
          <Text style={[styles.meta, styles.metaPlaceholder]} numberOfLines={1}>
            {placeholder}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailing}>
        {trailing ?? <ChevronRight size={18} color={palette.subtle} strokeWidth={1.75} />}
      </View>
    </Pressable>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      minHeight: 56,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 14,
      paddingVertical: 12,
      paddingLeft: 16,
      paddingRight: 10,
    },
    cardActive: {
      borderColor: p.hairlineStrong,
      shadowColor: "#0A0A0A",
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    dim: { opacity: 0.4 },
    leading: { width: 26, alignItems: "center", justifyContent: "center" },
    body: { flex: 1, gap: 3 },
    primary: {
      fontFamily: fonts.sans,
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 0.1,
      color: p.ink,
    },
    meta: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 16, color: p.muted },
    metaPlaceholder: { color: p.subtle, fontStyle: "italic" },
    trailing: { width: 20, alignItems: "center", justifyContent: "center" },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
